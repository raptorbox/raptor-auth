const logger = require('../logger')
const api = require('../api')
const authz = require('../authz')
const Promise = require('bluebird')

module.exports.authorize = (options, req) => {

    // handle permission path, eg. /token/62a9aa34-961f-47b0-9a29-ab373a898c0d
    if(options.type === 'permission' && (options.permission === 'update' || options.permission === 'read')) {
        const params = req.url.split('/')
        if(params.length === 3 && params[1] && params[2]) {
            options.type = params[1]
            options.subjectId = params[2]
        }
    }

    return Promise.resolve()
}

module.exports.router = (router) => {

    router.get('/:type/:id', function(req, res) {
        const acl = {
            type: req.params.type,
            subjectId: req.params.id,
        }
        return authz.list(acl)
            .then((acls) => {
                res.json(acls.map((a) => a.permission))
            })
    })

    router.put('/:type/:id', function(req, res) {
        const acl = {
            type: req.params.type,
            permissions: req.body.permissions,
            userId: req.body.userId,
            subjectId: req.params.id,
            allowed: req.body.allowed === false ? false : true,
        }

        let readCall = authz.loader(acl.type, acl.subjectId)

        // default to current user
        let readUser = Promise.resolve(req.user)
        if(acl.userId) {
            readUser = api.User.read({ id: acl.userId })
        } else {
            acl.userId = req.user.id
        }

        return readCall
            .then(() => {
                return readUser
                    .then(() => {
                        return Promise.all(acl.permissions.map((permission) => {
                            const obj = Object.assign({}, acl, { permission})
                            return authz.sync(obj)
                        }))
                            .then(() => {
                                logger.debug('Stored %s [id=%s] permissions %j', acl.type, acl.subjectId, acl.permissions)
                                res.json(acl.permissions)
                            })
                    })
            })
            .catch((e) => {
                return Promise.reject(e)
            })
    })

}
