module.exports.router = (router) => {

    const logger = require('../logger')
    const api = require('../api')

    router.get('/', function(req, res) {
        const q = {}
        if (req.query.username) {
            q.username = req.query.username
            delete req.query.username
        }
        return api.User.list(q, req.query)
            .then((users) => {
                logger.debug('Found %s users', users.length)
                res.json(users)
            })
    })

    router.post('/', function(req, res) {

        const user = Object.assign({}, req.body)
        if(user.id !== undefined) {
            delete user.id
        }

        //TODO review permission for users
        if(!req.user.isAdmin()) {
            user.roles = []
        }

        return api.User.create(user)
            .then((user) => {
                logger.debug('Created user %s [id=%s]', user.username, user.id)
                res.json(user)
            })
    })

    router.put('/:userId', function(req, res) {

        const u = Object.assign({}, req.body, { id: req.params.userId })

        //TODO review permission for users
        // only `admin`, `admin_user` can promote an user to admin
        if (u.roles) {

            u.roles = u.roles
                .filter((role) => role !== 'service')

            // cannot change roles
            if(!req.user.isAdmin()) {
                delete u.roles
            }
        }

        return api.User.update(u)
            .then((user) => {
                logger.debug('Updated user %s [id=%s]', user.username, user.id)
                res.json(user)
            })
    })

    router.delete('/:userId', function(req, res) {
        return api.User.read({ id: req.params.userId })
            .then(() => api.User.delete({ id: req.params.userId })
                .then(() => {
                    logger.debug('Deleted user %s', req.params.userId)
                    res.status(202).send()
                }))
    })

    router.get('/:userId/impersonate', function(req, res) {
        return api.User.read({ id: req.params.userId })
            .then((user) => {
                return api.Token.createLogin(user)
                    .then((t) => {
                        logger.debug('Impersonate %s', req.body.username)
                        res.json({
                            token: t.token,
                            expires: Math.round(t.expires / 1000),
                            user: user,
                        })
                    })
            })
    })

    router.get('/:userId', function(req, res) {
        return api.User.read({ id: req.params.userId })
            .then((user) => {
                res.json(user)
            })
    })

}
