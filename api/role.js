
const l = module.exports
const Role = require('../models/role')

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
