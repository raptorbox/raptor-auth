
const l = module.exports
const Token = require('../models/token')
const config = require('../config')

l.save = (t) => {
    return Token.findOne({name: t.name})
        .then((token) => {

            let genToken = false
            if(!token) {
                token = new Token(t)
                genToken = true
            } else {
                genToken = (t.secret !== token.secret)
                token = Object.assign(token, t, { token: token.token })
            }

            let p = Promise.resolve()
            if (genToken) {
                p = Token.generate(token.secret).then((hash) => {
                    token.token = hash
                    return Promise.resolve()
                })
            }

            return p.then(() => token.save())
        })
}

l.createLoginToken = (user) => {
    const t1 = (new Date().getTime())
    const sec = user.password + (Math.random()*t1)
    const token = new Token({
        name: 'login_'+t1,
        secret: sec,
        type: 'login',
        userId: user.uuid,
    })
    return l.save(token)
}
