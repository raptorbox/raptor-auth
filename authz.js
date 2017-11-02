
const errors = require('./errors')
const logger = require('./logger')
const api = require('./api')

const can = (req) => {

    let p = Promise.resolve(req.user)
    if(req.userId) {
        p = api.User.read({ uuid: req.userId })
    }

    return p.then((user) => {

        let p1 = Promise.resolve(req.subject)
        if(req.userId) {
            p1 = loader(req.type, req.objectId || req.subjectId)
                .catch((e) => {
                    if (e instanceof errors.BadRequest) {
                        // TODO: review this on impl is complete
                        return Promise.resolve(null)
                    }
                    return Promise.reject(e)
                })
        }

        return p1.then((subject) => {
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

                    logger.debug('Check %s_%s[%s] for %s in permissions %j',
                        req.type,
                        req.permission,
                        req.subjectId,
                        req.userId,
                        permissions)

                    if(has('admin')) {
                        return Promise.resolve()
                    }

                    if(req.type) {
                        if(has('admin_' + req.type)) {
                            return Promise.resolve()
                        }
                        if(has(req.permission + '_' + req.type)) {
                            return Promise.resolve()
                        }
                    }

                    if(subject) {

                        if(subject.isOwner && subject.isOwner(user)) {
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
                            logger.debug('User %s not allowed to %s on %s', user.username, req.permission, req.type)
                            return Promise.reject(e)
                        })
                })
        })
    })
}

const check = (options) => {

    options = options || {}
    options.permission = options.permission || null
    options.type = options.type || ''

    return (req, res, next) => {

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

        logger.debug('Check authorization for `%s` to `%s` on `%s`', req.user.username, options.permission, options.type)

        if(!req.user) {
            return new errors.Unauthorized()
        }

        return can({
            user: req.user,
            type: options.type || null,
            permission: options.permission
        })
            .then(()=> next())
            .catch((e)=> next(e))
    }
}

const loader = (entity, id) => {
    switch (entity) {
    case 'user':
        return api.User.read({ uuid: id })
    case 'token':
        return api.Token.read({ id })
    /// @TODO
    // case 'device':
    // case 'tree':
    // case 'app':
    default:
        return Promise.reject(new errors.BadRequest())
    }
}

const sync = (raw) => {
    const acl = new api.models.Acl(raw)
    return acl.save()
}

module.exports = { can, check, loader, sync }
