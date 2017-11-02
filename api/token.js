
const l = module.exports

const errors = require('../errors')
const Token = require('../models/token')

l.createLogin = (user) => {
    const t1 = Date.now()
    const sec = user.password.substr(7, 21) + Math.floor(Math.random()*t1)
    return l.create({
        name: 'login_'+t1,
        secret: sec,
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
        .then(token => token.merge(t))
        .then((token) => token.save())
}

l.create = (t) => {
    return (new Token(t)).save()
}

l.delete = (query) => {
    return Token.remove(query)
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
