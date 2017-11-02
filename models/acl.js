var mongoose = require('mongoose')
const Schema = mongoose.Schema

const Acl = new Schema({
    type: {
        type: String,
        required: true,
        index: true,
    },
    permission: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: String,
        ref: 'User',
        required: true,
    },
    subjectId: {
        type: String,
        required: true,
    },
    allowed: {
        type: Boolean,
        default: true
    },
}, {
    toJSON: {
        transform: function (doc, ret) {
            delete ret._id
            delete ret.__v
        }
    }
})

module.exports = mongoose.model('Acl', Acl)
