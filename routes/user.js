var logger = require('../logger')
var api = require('../api')

module.exports.router = (router) => {

    /**
     * @swagger
     * definitions:
     *   LoginRequest:
     *     type: object
     *     required:
     *       - username
     *       - password
     *     properties:
     *       username:
     *         type: string
     *       password:
     *         type: string
     *         format: password
     *   User:
     *     allOf:
     *       - $ref: '#/definitions/LoginRequest'
     *       - required:
     *         - uuid
     *         - email
     *         - enabled
     *         - roles
     *       - properties:
     *         uuid:
     *           type: string
     *         email:
     *           type: string
     *           format: email
     *         enabled:
     *           type: boolean
     *         roles:
     *           type: array
     *           items:
     *             type: string
     */

    router.get('/', function(req, res) {
        return api.User.list({}, req.params)
            .then((users) => {
                logger.debug('Found %s users', users.length)
                res.json(users)
            })
    })

    /**
     * @swagger
     * /user:
     *   post:
     *     tags:
     *       - User
     *     description: Creates a new user
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: user
     *         description: User object
     *         in: body
     *         required: true
     *         schema:
     *           $ref: '#/definitions/User'
     *     responses:
     *       200:
     *         description: Created
     *         schema:
     *           $ref: '#/definitions/User'
     */
    router.post('/', function(req, res) {
        return api.User.create(req.body)
            .then((user) => {
                logger.debug('Created user %s [id=%s]', user.username, user.uuid)
                res.json(user)
            })
    })

    router.put('/:userId', function(req, res) {
        const u = Object.assign({}, req.body, { uuid: req.params.userId })
        return api.User.update(u)
            .then((user) => {
                logger.debug('Updated user %s [id=%s]', user.username, user.uuid)
                res.json(user)
            })
    })

    router.delete('/:userId', function(req, res) {
        return api.User.delete({ uuid: req.params.userId })
            .then(() => {
                logger.debug('Deleted user %s', req.params.userId)
                res.status(202).send()
            })
    })

    router.get('/:userId', function(req, res) {
        return api.User.read({ uuid: req.params.userId })
            .then((user) => {
                res.json(user)
            })
    })

}
