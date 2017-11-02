
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

                    const permissions = roles.reduce((p, r) => p.concat(r.permissions), [])
                    const has = (perm) => {
                        const hasPerm = permissions.indexOf(perm) > -1
                        if(hasPerm) {
                            logger.debug('User %s can %s', user.username, perm)
                        }
                        return hasPerm
                    }

                    logger.debug('Check %s in permissions %j', req.permission, permissions)


                    if(has('admin')) {
                        return Promise.resolve()
                    }

                    if(req.type) {
                        if(has(req.type + '_admin')) {
                            return Promise.resolve()
                        }
                    }

                    if(subject) {
                        if(subject.getOwner && subject.getOwner().uuid === user.uuid) {
                            if(has('admin_own')) {
                                return Promise.resolve()
                            }
                            if(req.type) {
                                if(has(req.type + '_admin_own')) {
                                    return Promise.resolve()
                                }
                            }
                        }
                    }

                    // TODO: app level check
                    // TODO: acl check

                    logger.debug('User %s not allowed to %s on %s', user.username, req.permission, req.type)
                    return Promise.reject(new errors.Forbidden())
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

module.exports = { can, check, loader }
