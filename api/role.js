
const l = module.exports
const Role = require('../models/role')
const errors = require('../errors')
const broker = require('../broker')

const notify = (op, role) => {
    broker.send({type: 'role', id: role.id, op, role})
    return Promise.resolve(role)
}

l.save = (r) => {
    return Role.findOne({
        name: r.name,
        domain: r.domain || null
    })
        .then((role) => {
            const exists = role
            if(!exists) {
                role = new Role(r)
            } else {
                role = Object.assign(role, r)
            }
            return role.save()
                .then(() => notify(exists ? 'update' : 'create', role))
        })
}

l.delete = (role) => {
    return Role.remove(role)
        .then(() => notify('delete', role))
}

l.list = (query, pager) => {
    query = query || {}
    pager = pager || {}
    return Role.findPaged(query, pager)
}

l.read = (query) => {
    return Role.findOne(query)
        .then((role) => {
            if(!role) throw new errors.NotFound()
            return Promise.resolve(role)
        })
}
