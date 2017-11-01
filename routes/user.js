var passport = require('passport')
var api = require('../api')

const router = require('express-promise-router')()
module.exports = router

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
router.post('/', passport.authenticate('local'), function(req, res) {
    return api.User.save(req.body)
        .then((user) => {
            res.json(user)
        })
})
