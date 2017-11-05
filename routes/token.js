var logger = require('../logger')
var api = require('../api')

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
        let uuid = null
        if(req.query.uuid) {
            uuid = req.query.uuid
            delete req.query.uuid
        }
        if(!req.user.isAdmin()) {
            uuid = req.user.uuid
        }
        if(uuid) {
            q.userId = uuid
        }
        return api.Token.list(q, req.query)
            .then((tokens) => {
                logger.debug('Found %s tokens', tokens.content.length)
                res.json(tokens)
            })
    })

    router.post('/', function(req, res) {
        const raw = Object.assign({}, req.body)
        if(!raw.userId) {
            raw.userId = req.user.uuid
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
            raw.userId = req.user.uuid
        }
        return api.Token.update(raw)
            .then((token) => {
                logger.debug('Updated token %s', token.name)
                res.json(token)
            })
    })

    router.delete('/:id', function(req, res) {
        return api.Token.delete({ uuid: req.params.id })
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
