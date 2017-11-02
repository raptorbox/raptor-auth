const bcrypt = require('bcrypt')
var mongoose = require('mongoose')
var Schema = mongoose.Schema

const saltFactor = 10

var Token = new Schema({
    id: {
        type: String,
        index: true,
        required: true,
        unique: true,
        default: require('uuid/v4')
    },
    name: {
        type: String,
        index: true,
        required: true,
    },
    token: {
        type: String,
        index: true,
        unique: true,
        required: false,
    },
    secret: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: false,
        index: true,
    },
    enabled: {
        type: Boolean,
        default: true,
        required: true,
    },
    expires: {
        type: Date,
        // +30 min
        default: function() {
            return (new Date()).getTime() + (30 * (60 * 60 * 1000))
        },
        required: false
    },
    userId: {
        type: String,
        ref: 'User',
        index: true,
        required: true,
    }
}, {
    toJSON: {
        transform: function (doc, ret) {
            delete ret._id
            delete ret.__v
            delete ret.type
        }
    }
})

Token.plugin(require('./plugin/pager'))

Token.pre('save', function(next) {
    var token = this

    // only hash the password if it has been modified (or is new)
    if (!token.isModified('secret')) {
        return next()
    }

    bcrypt.hash(token.secret, saltFactor)
        .then((hash) => {
            token.token = hash
            next()
        })
        .catch((e) => {
            next(e)
        })
})

Token.methods.isOwner = function(user) {
    return this.userId === user.uuid
}

Token.methods.merge = function(t) {
    const token = this
    return Promise.resolve()
        .then(() => {

            if (t.name) {
                token.name = t.name
            }
            if (t.secret) {
                token.secret = t.secret
            }
            if (t.expires !== undefined) {
                if(t.expires === 0) {
                    t.expires = null
                } else {
                    token.expires = new Date(t.expires * 1000)
                }
            }

            if (t.enabled !== undefined && t.enabled !== null) {
                token.enabled = t.enabled
            }

            return Promise.resolve()
        })
        .then(() => Promise.resolve(token))
}

Token.statics.generate = function(sec) {
    return require('bcrypt').hash(sec, saltFactor)
}


module.exports = mongoose.model('Token', Token)
