var mongoose = require('mongoose')
var Schema = mongoose.Schema
const rand = require('./plugin/random')

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
    },
    clientId: {
        type: String,
        ref: 'Client',
        index: true,
        required: false,
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
Token.plugin(require('./plugin/token'))
Token.plugin(rand)

Token.methods.isOwner = function(user) {
    return this.userId === user.uuid
}

Token.methods.isExpired = function() {
    return Date.now() > this.expires
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

module.exports = mongoose.model('Token', Token)
