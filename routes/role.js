
var logger = require('../logger')
var api = require('../api')

module.exports.router = (router) => {

    /**
     * @swagger
     * definitions:
     *   Role:
     *     type: object
     *     required:
     *       - name
     *       - permissions
     *     properties:
     *       role:
     *         type: string
     *       permissions:
     *         type: array
     *         items:
     *           type: string
     */

    router.get('/', function(req, res) {
        return api.Role.list({ domain: null }, req.params)
            .then((roles) => {
                logger.debug('Found %s roles', roles.length)
                res.json(roles)
            })
    })

    const save = (req, res) => {

        const r = Object.assign({}, req.body)
        if(req.params.id) {
            r.id = req.params.id
        }

        return api.Role.save(r)
            .then((role) => {
                logger.debug('Saved role %s [permissions=%j]', role.name, role.permissions)
                res.json(role)
            })
    }

    router.post('/', function(req, res) {
        return save(req, res)
    })
    router.put('/:id', function(req, res) {
        return save(req, res)
    })

    router.delete('/:id', function(req, res) {
        return api.Role.delete({ name: req.params.id })
            .then(() => {
                logger.debug('Deleted role %s', req.params.id)
                res.status(202).send()
            })
    })

    router.get('/:role', function(req, res) {
        return api.Role.read({ name: req.params.role })
            .then((role) => {
                res.json(role)
            })
    })
}
