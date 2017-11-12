var mongoose = require('mongoose')
var Schema = mongoose.Schema

const uuidv4 = require('uuid/v4')

var Role = new Schema({
    id: {
        type: String,
        index: true,
        required: true,
        unique: true,
        default: uuidv4,
        set: function(v) {
            if(!v) {
                v = uuidv4()
            }
            return v
        }
    },
    name: {
        type: String,
        index: true,
    },
    permissions: [String],
    domain: {
        type: String,
        index: true,
        default: null,
    }
}, {
    toJSON: {
        transform: function (doc, ret) {
            delete ret._id
            delete ret.__v
            if(!ret.domain) {
                delete ret.domain
            }
        }
    }
})

Role.plugin(require('./plugin/pager'))

module.exports = mongoose.model('Role', Role)
