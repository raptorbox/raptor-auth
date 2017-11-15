
const errors = require('./errors')
const logger = require('./logger')
const api = require('./api')

const can = (req) => {

    let p
    if (req.user) {
        p = Promise.resolve(req.user)
    } else {
        if(req.userId) {
            p = loader('user', req.userId).then((user) => {
                req.user = user
                return Promise.resolve(user)
            })
        } else {
            p = Promise.reject(new errors.NotFound('Missing user'))
        }
    }

    return p.then(() => {

        // service role
        if(req.user.roles.indexOf('service') > -1) {
            logger.debug('Allow service user')
            return Promise.resolve()
        }

        let p1
        if(req.subject) {
            p1 = Promise.resolve(req.subject)
        } else {
            if(req.subjectId) {
                p1 = loader(req.type, req.subjectId).then((subj) => {
                    req.subject = subj
                    return Promise.resolve(subj)
                })
            } else {
                p1 = Promise.resolve(null)
            }
        }

        return p1.then(() => {

            return api.models.Role.find({ name: { $in: req.user.roles }})
                .then((roles) => {

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

                    logger.debug('Check %s_%s [id=%s] for %s in permissions %j',
                        req.type,
                        req.permission,
                        req.subjectId || '',
                        req.user.id,
                        permissions)

                    if(has('admin') || has('service')) {
                        return Promise.resolve()
                    }

                    // allow create on admin_own*
                    if( !req.subject && (
                        req.permission === 'create' ||
                        req.permission === 'read' // list
                    )) {
                        if(has('admin_own')) {
                            return Promise.resolve()
                        }
                        if(req.type && has('admin_own_' + req.type)) {
                            return Promise.resolve()
                        }
                    }

                    if(req.type) {
                        if(has(`admin_${req.type}`)) {
                            return Promise.resolve()
                        }
                        if(has(`${req.permission}_${req.type}`)) {
                            return Promise.resolve()
                        }
                    }

                    if(req.subject) {
                        if(isOwner(req.type, req.subject, req.user)) {
                            if(has('admin_own')) {
                                return Promise.resolve()
                            }
                            if(req.type) {
                                //admin_own_device
                                if(has('admin_own_' + req.type)) {
                                    return Promise.resolve()
                                }
                                //read_own_device
                                if(has(req.permission + '_own_' + req.type)) {
                                    return Promise.resolve()
                                }
                            }
                        }

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
                            logger.debug('User `%s` not allowed to `%s` on `%s`', req.user.username, req.permission, req.type)
                            return Promise.reject(e)
                        })
                    })
                })
        })
    })
        .catch((e) => {
            logger.warn('Check failed: %s', e.message)
            logger.debug(e.stack)
            return Promise.reject(e)
        })
}


const hasAppPermission = (req) => {

    const raptor = require('./raptor').client()

    if (!req.subject || !req.subject.domain) {
        return Promise.resolve({ result: false })
    }

    const q = {
        users: [ req.user.id ]
    }

    if(req.type === 'device') {
        if (req.subject) {
            q.devices = [ req.subject.id ]
        }
    }
    if(req.type === 'app') {
        q.id = req.subject.id
    }

    logger.debug('App lookup %j', q)
    return raptor.App().search(q).then((pager) => {

        const allowed = pager.getContent().filter((app) => {

            console.warn(JSON.stringify(app, null, 2))
            const r = {}
            app.roles.forEach((role) => r[role.name] = role)

            return app.users.filter((u) => {
                u.roles
            })
        }).length > 0

        return Promise.resolve({ result: allowed })
    })
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
    opts.type = opts.type || ''
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

            logger.debug('Check authorization for `%s` to `%s` on `%s` [id=%s]',
                user.username,
                options.permission,
                options.type,
                options.subjectId || ''
            )

            return can({
                user,
                type: options.type || null,
                permission: options.permission,
                subjectId: options.subjectId || null
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

    logger.debug('Loading `%s` [id=%s]', type, id)
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
            return sdk.Tree().tree({ id })
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
