
const l = module.exports

const errors = require('../errors')
const broker = require('../broker')
const cache = require('../cache')
const User = require('../models/user')

const notify = (op, user) => {
    broker.send({type: 'user', id: user.id, op, user})
    return Promise.resolve(user)
}

l.list = (query, pager) => {
    query = query || {}
    pager = pager || {}
    return User.findPaged(query, pager)
}

l.read = (query) => {
    let p = Promise.resolve(null)
    if(query && query.id) {
        p = cache.get(`user_${query.id}`)
            .then((json) => {

                if(json) {
                    json = new User(json)
                    json.isNew = false
                }

                return Promise.resolve(json)
            })
    }
    return p.then((user) => {
        if (user) return Promise.resolve(user)
        return User.findOne(query)
            .then((user) => {
                if(!user) throw new errors.NotFound()
                return Promise.resolve(user)
            })
    })
}

l.update = (u) => {
    return l.read({ username: u.username })
        .then(user => user.merge(u)
            .then(() => user.save()
                .then((user) => cache.set(`user_${user.id}`, user.toObject()))
                .then((user) => notify('update', user))
            )
        )
}

l.create = (u) => {
    return new User().merge(u)
        .then((user) => user.save())
        .then((user) => cache.set(`user_${user.id}`, user.toObject()))
        .then((user) => notify('create', user))
}

l.delete = (user) => {
    return User.remove({ id: user.id })
        .then((user) => {
            return cache.del(`user_${user.id}`)
                .then(() => Promise.resolve(user))
        })
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
