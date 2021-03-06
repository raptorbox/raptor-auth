
module.exports.authorize = (options, req) => {

    // /token/check
    if (req.url === '/check') {
        options.permission = 'read'
    }

    return Promise.resolve()
}

module.exports.router = (router) => {

    const logger = require('../logger')
    const api = require('../api')
    const errors = require('../errors')
    const qp = require('../query-parser')

    router.get('/', function(req, res) {

        let p = qp.parse({
            params: req.query,
            queryFields: [ 'name', 'id', 'enabled' ]
        })

        const q = Object.assign({}, p.query, {
            type: 'DEFAULT'
        })

        let uid = null
        if(p.query.userId) {
            uid = p.query.userId
        }
        if(!req.user.isAdmin()) {
            uid = p.query.userId
            if(req.query.userId && !p.query.userId) {
                uid = req.query.userId
            }
        }
        if(uid) {
            q.userId = uid
        }

        return api.Token.list(q, p.pager)
            .then((tokens) => {
                logger.debug('Found %s tokens', tokens.content.length)
                res.json(tokens)
            })
    })

    router.post('/check', function(req, res) {
        if(!req.body.token) {
            return Promise.reject(new errors.BadRequest('Missing token field'))
        }
        return api.Token.read({ token: req.body.token})
            .then((token) => {
                if(!token.isValid()) {
                    return Promise.reject(new errors.Unauthorized('Token is not valid [1]'))
                }
                return api.User.read({ id: token.userId }).then((user) => {
                    if(!user.enabled) {
                        return Promise.reject(new errors.Unauthorized('Token is not valid [2]'))
                    }
                    return user.loadRoles().then((roles) => {
                        logger.debug('Valid token %s [user=%s type=%s expires=%s]', token.name, user.username, token.type, token.expires || '0')
                        const json = user.toJSON()
                        json.roles = roles
                        json.token = token.toJSON()
                        res.json(json)
                    })
                })
            })
    })

    router.post('/', function(req, res) {
        const raw = Object.assign({}, req.body)
        if(!raw.userId) {
            raw.userId = req.user.id
        }
        return api.Token.create(raw)
            .then((token) => {
                logger.debug('Created token %s [type=%s expires=%s]', token.name, token.type, token.expires)
                res.json(token)
            })
    })

    router.put('/:id', function(req, res) {
        const raw = Object.assign({}, req.body, { id: req.params.id })
        if(!raw.userId) {
            raw.userId = req.user.id
        }
        return api.Token.update(raw)
            .then((token) => {
                logger.debug('Updated token %s [expires=%s]', token.name, token.expires)
                res.json(token)
            })
    })

    router.delete('/:id', function(req, res) {
        return api.Token.delete({ id: req.params.id })
            .then(() => {
                logger.debug('Deleted token %s', req.params.id)
                res.status(202).send()
            })
    })


    router.get('/current', function(req, res) {
        res.json(req.authInfo.token)
    })

    router.get('/:id', function(req, res) {
        return api.Token.read({ id: req.params.id })
            .then((token) => {
                res.json(token)
            })
    })

}
