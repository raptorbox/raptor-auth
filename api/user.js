
const l = module.exports

const errors = require('../errors')
const User = require('../models/user')

l.find = (query, pager) => {
    query = query || {}
    pager = pager || {}
    return User.findPaged(query, pager)
}

l.read = (query) => {
    return User.findOne(query)
        .then((user) => {
            if(!user) throw new errors.NotFound()
            return Promise.resolve(user)
        })
}

l.update = (u) => {
    return l.read({ username: u.username })
        .then(user => user.merge(u))
        .then(User.save)
}

l.create = (u) => {
    return (new User(u)).save()
}

l.delete = (query) => {
    return User.remove(query)
}

l.save = (u) => {
    return l.update(u)
        .catch((e) => {
            if(e instanceof errors.NotFound) {
                return l.create(u)
            }
            return Promise.reject(e)
        })
}
