
const l = module.exports

const errors = require('../errors')
const broker = require('../broker')
const Client = require('../models/oauth2/client')

const notify = (op, c) => {
    broker.send({type: 'client', id: c.id, op, c})
    return Promise.resolve(c)
}

l.list = (query, pager) => {
    query = query || {}
    pager = pager || {}
    return Client.findPaged(query, pager)
}

l.read = (query) => {
    return Client.findOne(query)
        .then((client) => {
            if(!client) throw new errors.NotFound()
            return Promise.resolve(client)
        })
}

l.update = (c) => {
    return l.read({ id: c.id })
        .then(client => client.merge(c)
            .then(() => client.save()
                .then((client) => notify('update', client))
            )
        )
}

l.create = (c) => {
    return (new Client(c)).save()
        .then((client) => notify('create', client))
}

l.delete = (client) => {
    return Client.remove({ id: client.id })
        .then((client) => notify('delete', client))
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
