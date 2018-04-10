
const logger = require('../logger')
const api = require('../api')
const config = require('../config')
const qp = require('../query-parser')

// disallow configuration managed roles
const isReservedRole = (r) => {
    let objKeysMap = Object.keys(config.roles).map((k) => config.roles[k]);
    return !r.domain && objKeysMap.filter((r1) => r1.name === r.name).length !== 0
}

module.exports.router = (router) => {

    router.get('/', function(req, res) {

        let p = qp.parse({
            params: req.query,
            queryFields: [ 'name', 'id', 'domain' ]
        })

        return api.Role.list(p.query, p.pager)
            .then((roles) => {
                logger.debug('Found %s roles', roles.content.length)
                res.json(roles)
            })
    })

    const save = (r, res) => {

        if(isReservedRole(r)) {
            return Promise.reject(new require('../errors').BadRequest(`Role '${r.name}' is reserved`))
        }

        return api.Role.save(r)
            .then((role) => {
                logger.debug('Saved role %s [permissions=%j]', role.name, role.permissions)
                res.json(role)
            })
    }

    router.post('/', function(req, res) {

        const body = Object.assign({}, req.body)
        if (body.id)  {
            delete body.id
        }

        return save(body, res)
    })
    router.put('/:id', function(req, res) {

        const body = Object.assign({}, req.body)
        body.id = req.params.id

        return save(body, res)
    })

    router.delete('/:id', function(req, res) {
        return api.Role.read({ id: req.params.id }).then((r) => {

            if(isReservedRole(r)) {
                return Promise.reject(new require('../errors').BadRequest(`Role '${r.name}' is reserved`))
            }

            return api.Role.delete({ id: req.params.id })
                .then(() => {
                    logger.debug('Deleted role %s', req.params.id)
                    res.status(202).send()
                })
        })
    })

    router.get('/:id', function(req, res) {
        return api.Role.read({ id: req.params.id })
            .then((role) => {
                res.json(role)
            })
    })
}
