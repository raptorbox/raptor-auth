const logger = require('../logger')
const api = require('../api')
const authz = require('../authz')
const Promise = require('bluebird')

module.exports.router = (router) => {

    router.get('/:type/:id', function(req, res) {
        const acl = {
            type: req.params.type,
            id: req.params.id,
        }
        return authz.list(acl)
            .then((acls) => {
                res.json(acls)
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
            readUser = api.User.read({ uuid: acl.userId })
        } else {
            acl.userId = req.user.uuid
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
                                logger.debug('Stored %s [id=%s] permissions [%j]', acl.type, acl.subjectId, acl.permissions)
                                res.json(acl.permissions)
                            })
                    })
            })
            .catch((e) => {
                return Promise.reject(e)
            })
    })

}
