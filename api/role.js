
const l = module.exports
const Role = require('../models/role')
const errors = require('../errors')

l.save = (r) => {
    return Role.findOne({name: r.name})
        .then((role) => {
            if(!role) {
                role = new Role(r)
            } else {
                role = Object.assign(role, r)
            }
            return role.save()
        })
}

l.delete = (query) => {
    return Role.remove(query)
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
