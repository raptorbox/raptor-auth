var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Role = new Schema({
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
        }
    }
})

Role.plugin(require('./plugin/pager'))

module.exports = mongoose.model('Role', Role)
