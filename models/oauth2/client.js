const mongoose = require('mongoose')
const Schema = mongoose.Schema
const rand = require('../plugin/random')

const Client = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    id: {
        type: String,
        unique: true,
        required: true,
        default: require('uuid/v4')
    },
    secret: {
        type: String,
        required: true,
        default: rand.random,

    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    enabled: {
        type: Boolean,
        required: true,
        default: true,
    },
}, {
    toJSON: {
        transform: function (doc, ret) {
            delete ret._id
            delete ret.__v
        }
    }
})

Client.plugin(require('../plugin/pager'))
Client.plugin(rand)

Client.methods.isOwner = function(user) {
    return this.userId === user.uuid
}

Client.methods.merge = function(c) {
    const client = this
    return Promise.resolve()
        .then(() => {

            if (c.name) {
                client.name = c.name
            }

            if (c.enabled !== undefined && c.enabled !== null) {
                client.enabled = c.enabled
            }

            if (c.userId) {
                client.userId = c.userId
            }

            if (c.secret) {
                client.secret = c.secret
            }

            return Promise.resolve()
        })
        .then(() => Promise.resolve(client))
}

module.exports = mongoose.model('Client', Client)
