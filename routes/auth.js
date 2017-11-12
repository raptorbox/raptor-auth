const passport = require('passport')
const api = require('../api')
const logger = require('../logger')

module.exports.router = (router) => {

    const bearerAuth = () => {
        return passport.authenticate('bearer', {
            failWithError: true,
            session: false
        })
    }

    router.post('/login', passport.authenticate('local', {
        failWithError: true, session: false
    }), function(req, res) {
        return api.Token.createLogin(req.user)
            .then((t) => {
                logger.debug('Logged in %s', req.body.username)
                res.json({
                    token: t.token,
                    expires: Math.round(t.expires / 1000),
                    user: req.user,
                })
            })
    })

    const logout = (req, res) => {
        return api.models.Token.remove({ _id: req.authInfo.token._id })
            .then(() => {
                req.logout()
                res.status(202).send()
            })
    }

    router.delete('/login', bearerAuth(), logout)
    router.get('/logout', bearerAuth(), logout)

    router.get('/refresh', bearerAuth(), function(req, res){
        return api.models.Token.remove({ _id: req.authInfo.token._id })
            .then(() => api.Token.createLogin(req.user))
            .then((t) => {
                res.json({
                    token: t.token,
                    expires: Math.round(t.expires / 1000)
                })
            })
    })

    router.get('/me', bearerAuth(), function(req, res) {
        res.json(req.user)
        return Promise.resolve()
    })

    router.post('/check', bearerAuth(), function(req, res) {
        const body = Object.assign({}, req.body)
        body.subjectId = body.subjectId || body.objectId
        if(!body.userId) {
            body.user = req.user
        }
        return require('../authz').can(body)
            .then(() => res.json({
                result: true
            }))
            .catch(() => res.json({
                result: false,
                // code: e.code,
                // message: e.message,
            }))
    })

    router.post('/sync', bearerAuth(), function(req, res) {
        return require('../authz').sync(req.body)
            .then(() => res.status(202).send())
    })

}
