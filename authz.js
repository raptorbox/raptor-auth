
const Promise = require('bluebird')
const errors = require('./errors')
const logger = require('./logger')
const api = require('./api')

const loadUser = (req) => {
    if (req.user) {
        return Promise.resolve()
    }
    if(req.userId) {
        return loader('user', req.userId).then((user) => {
            req.user = user
            return Promise.resolve()
        })
    }
    return Promise.reject(new errors.NotFound('Missing user'))
}

const loadSubject = (req) => {
    if(req.subject) {
        return Promise.resolve(req.subject)
    }
    if(req.subjectId) {
        return loader(req.type, req.subjectId).then((subj) => {
            req.subject = subj
            return Promise.resolve()
        })
    }
    return Promise.resolve()
}

const loadDomain = (req) => {

    let domain = req.domain
    // set subject default domain
    if(!domain && req.subject && req.subject.domain) {
        domain = req.subject.domain
    }

    if(domain) {

        // skip call for app when subj === domain
        if(req.type === 'app' && (req.subject && req.subject.id === domain)) {
            req.domain = req.subject
            return Promise.resolve()
        }

        return loader('app', domain).then((d) => {
            req.domain = d
            return Promise.resolve()
        })
    }

    return Promise.resolve()
}

const checkPermission = ({ roles, req, hasOwnership }) => {

    const permissions = roles.reduce((p, r) => {
        return p.concat(r.permissions)
    }, [])

    const has = (perm) => {
        const hasPerm = permissions.indexOf(perm) > -1
        if(hasPerm) {
            logger.debug('User `%s` can `%s`', req.user.username, perm)
        }
        return hasPerm
    }

    logger.debug('Check `%s_%s` userId=%s subjectId=%s domain=%s',
        req.permission,
        req.type,
        req.user.id,
        req.subject ? req.subject.id : '',
        req.domain ? req.domain.id : '')

    if(has('admin') || has('service')) {
        return true
    }

    // allow create and list/search on admin_own*
    if( !req.subject && (req.permission === 'create' || req.permission === 'read')) {
        if(has('admin_own')) {
            return true
        }
        if(req.type) {
            if (//has('admin_own_' + req.type) ||
                has('create_own_' + req.type) ||
                    has('read_own_' + req.type)) {
                return true
            }
        }
    }

    if(req.type) {
        if(has(`admin_${req.type}`)) {
            return true
        }
        if(has(`${req.permission}_${req.type}`)) {
            return true
        }
    }

    if(req.subject) {
        if(hasOwnership && hasOwnership()) {
            if(has('admin_own')) {
                return true
            }
            if(req.type) {
                //admin_own_device
                if(has('admin_own_' + req.type)) {
                    return true
                }
                //read_own_device
                if(has(req.permission + '_own_' + req.type)) {
                    return true
                }
            }
        }
    }

    return false
}

const can = (req) => {

    return loadUser(req).then(() => {
        // check for service role
        if(req.user && req.user.roles.indexOf('service') > -1) {
            logger.debug('Allow [service] user')
            return Promise.resolve({ result: true })
        }
        return loadSubject(req)
    }).then((res) => {
        if (res && res.result) {
            return Promise.resolve(res)
        }
        return loadDomain(req)
    }).then((res) => {

        if(res && res.result === true) {
            return Promise.resolve()
        }

        return req.user.loadRoles()
            .then((roles) => {

                const allowed = checkPermission({
                    roles, req,
                    hasOwnership: () => isOwner(req.type, req.subject, req.user)
                })
                if(allowed) {
                    return Promise.resolve()
                }

                // app level check
                return hasAppPermission(req).then((response) => {

                    if (response.result) {
                        return Promise.resolve()
                    }

                    // acl check
                    const q = Object.assign({}, req)
                    q.permission = { $in: [ q.permission, 'admin' ] }
                    return api.models.Acl.find(req).then((acls) => {
                        if(acls.filter((acl) => acl.allowed).length) {
                            return Promise.resolve()
                        }
                        return Promise.reject(new errors.Forbidden())
                    }).catch((e) => {
                        logger.debug('User `%s` not allowed to `%s` on `%s` %s',
                            req.user.username,
                            req.permission,
                            req.type,
                            (req.subject ? req.subject.id : req.subjectId)) || ''
                        return Promise.reject(e)
                    })
                })
            })
    }).catch((e) => {
        logger.warn('Check failed: %s', e.message)
        logger.debug(e.stack)
        return Promise.reject(e)
    })
}


const hasAppPermission = (req) => {

    if (!req.subject) {
        logger.debug('Skip app check, missing subject')
        return Promise.resolve({ result: false })
    }

    let app = req.domain
    if (!app && (req.type === 'app' && req.subject)) {
        app = req.subject
    }

    if (!app) {
        logger.debug('Skip app check, missing domain')
        return Promise.resolve({ result: false })
    }

    const appUsers = app.users.filter((u) => u.id === req.user.id)
    if (appUsers.length === 0) {
        logger.debug('User %s is not in app %s', req.user.id, app.id)
        return Promise.resolve({ result: false })
    }

    const appUser = appUsers[0]
    const userAppRoles = app.roles.filter((r) => appUser.roles.indexOf(r.name) > -1)

    const allowed = checkPermission({
        req, roles: userAppRoles
    })

    return Promise.resolve({ result: allowed })
}

// route level check to close the authorization process, when opts.last != true.
// Required on all routes definitions
const last = () => {
    return function(req, res, next) {
        if(req.isAuthorized === undefined) {
            return next(new errors.InternalServer('Authorization failed'))
        }
        if(req.isAuthorized === true) {
            return next()
        }
        else {
            return next(req.isAuthorized)
        }
    }
}

const check = (opts) => {

    opts = opts || {}
    opts.permission = opts.permission || null
    opts.type = opts.type || null
    opts.domain = opts.domain || null
    // if last === true and authz fails will throw a 401/403 and stop the request
    // used to have more granular permission checking on the single route
    // default: true (req fail if not authorized)
    opts.last = opts.last === false ? false : true

    return (req, res, next) => {

        const options = Object.assign({}, opts)
        options.subjectId = options.subjectId || options.objectId

        if(req.isAuthorized === true) {
            return next()
        }

        if (options.permission === null) {
            switch (req.method.toLowerCase()) {
            case 'post':
                options.permission = 'create'
                break
            case 'get':
                options.permission = 'read'
                break
            case 'put':
                options.permission = 'update'
                break
            case 'delete':
                options.permission = 'delete'
                break
            default:
                options.permission = 'admin'
            }
        }

        if(!req.user) {
            return Promise.reject(new errors.Unauthorized())
        }

        let authorized = Promise.resolve()
        // routes group level callback
        if(options.authorize) {
            authorized = options.authorize(options, req)
        }

        return authorized.then(() => {

            if(options.subjectId == null) {
                options.subjectId = getRequestEntityId(options.type, req)
            }

            let user = options.user || req.user

            logger.debug('Check authorization for `%s` to `%s` on `%s` [id=%s domain=]',
                user.username,
                options.permission,
                options.type,
                options.subjectId || '',
                options.domain || ''
            )

            return can({
                user,
                type: options.type || null,
                permission: options.permission,
                subjectId: options.subjectId || null,
                domain: options.domain || null
            })
        }).then(()=> {
            req.isAuthorized = true
            next()
        }).catch((e)=> {

            req.isAuthorized = e

            // not last, other checks will follow
            if(!opts.last) {
                return next()
            }

            logger.debug('Not Allowed: %s', e.message)
            next(e)
        })
    }
}

const isOwner = (type, subject, user) => {
    switch (type) {
    case 'user':
    case 'profile':
        return subject.id === user.id
    case 'role':
        return false
    case 'token':
    case 'client':
    case 'device':
    case 'tree':
    case 'app':
        return subject.userId === user.id
    default:
        return null
    }
}

const getRequestEntityId = (type, req) => {
    switch (type) {
    case 'user':
        return req.params.userId
    case 'token':
        return req.params.id
    case 'role':
        return req.params.id
    case 'client':
        return req.params.clientId
    default:
        return null
    }
}

const loader = (type, id) => {

    logger.debug('Loading type=%s id=%s', type, id)
    const sdk = require('./raptor').client()

    const loadType = () => {
        switch (type) {
        case 'user':
        case 'profile':
            return api.User.read({ id })
        case 'token':
            return api.Token.read({ id })
        case 'role':
            return api.Role.read({ id })
        case 'client':
            return api.Client.read({ id })
        case 'device':
            return sdk.Inventory().read({ id })
        case 'tree':
            return sdk.Tree().read({ id })
        case 'app':
            return sdk.App().read({ id })
        default:
            return Promise.reject(new errors.BadRequest())
        }
    }

    return loadType()
}

const sync = (raw) => {
    const acl = new api.models.Acl(raw)
    return acl.save()
}

const list = (q) => {
    return api.models.Acl.find(q)
}

module.exports = { can, check, last, loader, sync, list, hasAppPermission }
