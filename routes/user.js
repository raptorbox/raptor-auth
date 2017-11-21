module.exports.router = (router) => {

    const logger = require('../logger')
    const api = require('../api')

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
     *         - id
     *         - email
     *         - enabled
     *         - roles
     *       - properties:
     *         id:
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
        const q = {}
        return api.User.list(q, req.params)
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
