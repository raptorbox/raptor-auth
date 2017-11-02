
const l = module.exports

const errors = require('../errors')
const broker = require('../broker')
const User = require('../models/user')

const notify = (op, user) => {
    broker.send({type: 'user', id: user.uuid, op, user})
    return Promise.resolve(user)
}

l.list = (query, pager) => {
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
        .then(user => user.merge(u)
            .then(() => user.save()
                .then((user) => notify('update', user))
            )
        )
}

l.create = (u) => {
    return (new User(u)).save()
        .then((user) => notify('create', user))
}

l.delete = (user) => {
    return User.remove({ uuid: user.uuid })
        .then((user) => notify('delete', user))
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
