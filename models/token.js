var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Token = new Schema({
    name: {
        type: String,
        index: true,
        required: true,
    },
    token: {
        type: String,
        index: true,
        unique: true,
        required: true,
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
        default: true
    },
    expires: {
        type: Date,
        // +30 min
        default: function() {
            return (new Date()).getTime() + (30 * (60 * 60 * 1000))
        }
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
        }
    }
})

Token.statics.generate = function(sec) {
    return require('bcrypt').hash(sec, 10)
}

module.exports = mongoose.model('Token', Token)
