
const l = module.exports

const errors = require('../errors')
const Token = require('../models/token')
const broker = require('../broker')

const notify = (op, token) => {
    broker.send({type: 'token', id: token.id, op, token})
    return Promise.resolve(token)
}

l.createLogin = (user) => {
    const t1 = Date.now()
    return l.create({
        name: 'login_'+t1,
        type: 'login',
        userId: user.uuid,
    })
}

l.list = (query, pager) => {
    query = query || {}
    pager = pager || {}
    return Token.findPaged(query, pager)
}

l.read = (query) => {
    return Token.findOne(query)
        .then((token) => {
            if(!token) throw new errors.NotFound()
            return Promise.resolve(token)
        })
}

l.update = (t) => {
    return l.read({ id: t.id })
        .then(token => token.merge(t)
            .then((token) => token.save()
                .then(() => notify('update', token))
            )
        )
}

l.create = (t) => {
    const token = new Token(t)
    return token.save()
        .then(() => notify('create', token))
}

l.delete = (token) => {
    return Token.remove(token)
        .then((token) => notify('delete', token))
}

l.save = (t) => {
    return l.update(t)
        .catch((e) => {
            if(e instanceof errors.NotFound) {
                return l.create(t)
            }
            return Promise.reject(e)
        })
}
