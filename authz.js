
const errors = require('./errors')
const logger = require('./logger')
const api = require('./api')
const cache = require('./cache')

const can = (req) => {

    const cacheInfo = Object.assign({}, req)

    let p
    if (req.user) {
        p = Promise.resolve(req.user)
    } else {
        if(req.userId) {
            p = loader('user', req.userId)
        } else {
            p = Promise.reject(new errors.NotFound('Missing user'))
        }
    }

    return p.then((user) => {

        cacheInfo.userId = user.id

        // service role
        if(user.roles.indexOf('service') > -1) {
            return Promise.resolve()
        }

        let p1
        if(req.subject) {
            p1 = Promise.resolve(req.subject)
        } else {
            if(req.subjectId) {
                p1 = loader(req.type, req.subjectId)
            } else {
                p1 = Promise.resolve(null)
            }
        }

        return p1.then((subject) => {

            cacheInfo.subjectId = cacheInfo.subjectId || (subject ? subject.id : null)

            return api.models.Role.find({ name: { $in: user.roles }})
                .then((roles) => {

                    const permissions = roles.reduce((p, r) => {
                        return p.concat(r.permissions)
                    }, [])

                    const has = (perm) => {
                        const hasPerm = permissions.indexOf(perm) > -1
                        if(hasPerm) {
                            logger.debug('User %s can %s', user.username, perm)
                        }
                        return hasPerm
                    }

                    logger.debug('Check %s_%s [id=%s] for %s in permissions %j',
                        req.type,
                        req.permission,
                        req.subjectId || '',
                        user.id,
                        permissions)

                    if(has('admin') || has('service')) {
                        return Promise.resolve()
                    }

                    // allow create on admin_own*
                    if( !subject && (
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

                    if(subject) {
                        if(isOwner(req.type, subject, user)) {
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

                    // TODO: app level check

                    // acl check
                    const q = Object.assign({}, req)
                    q.permission = { $in: [ q.permission, 'admin' ] }
                    return api.models.Acl.find(req)
                        .then((acls) => {
                            if(acls.filter((acl) => acl.allowed).length) {
                                return Promise.resolve()
                            }
                            return Promise.reject(new errors.Forbidden())
                        })
                        .catch((e) => {
                            logger.debug('User `%s` not allowed to `%s` on `%s`', user.username, req.permission, req.type)
                            return Promise.reject(e)
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

const check = (opts) => {

    opts = opts || {}
    opts.permission = opts.permission || null
    opts.type = opts.type || ''

    return (req, res, next) => {

        const options = Object.assign({}, opts)
        options.subjectId = options.subjectId || options.objectId

        if(req.isAuthorized) {
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

        // HACK handle permission path, eg. /token/62a9aa34-961f-47b0-9a29-ab373a898c0d
        if(options.type === 'permission' && (options.permission === 'update' || options.permission === 'read')) {
            const params = req.url.split('/')
            if(params.length === 3 && params[1] && params[2]) {
                options.type = params[1]
                options.subjectId = params[2]
            }
        }

        if(options.subjectId == null) {
            options.subjectId = getRequestEntityId(options.type, req)
        }

        logger.debug('Check authorization for `%s` to `%s` on `%s` [id=%s]',
            req.user.username,
            options.permission,
            options.type,
            options.subjectId || ''
        )

        if(!req.user) {
            return Promise.reject(new errors.Unauthorized())
        }

        return can({
            user: req.user,
            type: options.type || null,
            permission: options.permission,
            subjectId: options.subjectId || null
        })
            .then(()=> {
                logger.debug('Allowed')
                next()
            })
            .catch((e)=> {
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

    const cacheKey = type + '_' + id

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

    // cache
    return cache.get(cacheKey).then((val) => {
        if(val) {
            return Promise.resolve(val)
        }
        return loadType()
            .then((el) => {
                return cache.set(cacheKey, el, { ttl: 30 }) // 30 sec
                    .catch((e) => {
                        logger.warn('Failed to store cache %s: %s', cacheKey, e.message)
                        return Promise.resolve(el)
                    })
            })
    })
}

const sync = (raw) => {
    const acl = new api.models.Acl(raw)
    return acl.save()
}

const list = (q) => {
    return api.models.Acl.find(q)
}

module.exports = { can, check, loader, sync, list }
