
const bcrypt = require('bcryptjs')
const rand = require('./random')

module.exports = function (schema, options) {
    options = options || { saltFactor: 10 }

    schema.statics.generate = function(sec) {
        sec = sec || rand.random()
        return bcrypt.hash(sec, options.saltFactor)
    }

    schema.pre('validate', function(next) {
        const token = this

        if (!schema.tree.token || !schema.tree.secret) {
            return next()
        }

        if(!token.secret) {
            token.secret = rand.random()
        }

        next()
    })

    schema.pre('save', function(next) {
        const token = this

        if (!schema.tree.token || !schema.tree.secret) {
            return next()
        }

        // only hash the password if it has been modified (or is new)
        if (!token.isModified('secret') && token.token) {
            return next()
        }

        bcrypt.hash(token.secret, options.saltFactor)
            .then((hash) => {
                token.token = hash
                next()
            })
            .catch((e) => {
                next(e)
            })
    })

}
