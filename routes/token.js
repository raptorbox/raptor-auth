const logger = require('../logger')
const api = require('../api')
const errors = require('../errors')

module.exports.router = (router) => {

    /**
     * @swagger
     * definitions:
     *   CreateTokenRequest:
     *     type: object
     *     required:
     *       - name
     *       - secret
     *       - expires
     *       - enabled
     *     properties:
     *       name:
     *         type: string
     *       secret:
     *         type: string
     *         format: password
     *       expires:
     *         type: date
     *       enabled:
     *         type: boolean
     *   Token:
     *     allOf:
     *       - $ref: '#/definitions/CreateTokenRequest'
     *       - required:
     *         - token
     *         - userId
     *       - properties:
     *         userId:
     *           type: string
     *         token:
     *           type: string
     */
    router.get('/', function(req, res) {
        const q = {
            type: 'DEFAULT'
        }
        let uid = null
        if(req.query.userId) {
            uid = req.query.userId
            delete req.query.userId
        }
        if(!req.user.isAdmin()) {
            uid = req.user.id
        }
        if(uid) {
            q.userId = uid
        }
        return api.Token.list(q, req.query)
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
                    logger.debug('Valid token %s [user=%s type=%s expires=%s]', token.name, user.username, token.type, token.expires || '0')
                    res.json({
                        id: token.id,
                        userId: user.id,
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
