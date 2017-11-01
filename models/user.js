const bcrypt = require('bcrypt')
var mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    uuid: {
        type: String,
        required: true,
        unique: true,
        default: require('uuid/v4'),
        index: true,
    },
    password: {
        type: String,
        required: true
    },
    roles: {
        type: [String],
        default: ['user']
    },
    email: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    fullName: String,
    enabled: {
        type: Boolean,
        default: true
    },
    created: {
        type: Date,
        default: Date.now
    }
}, {
    toJSON: {
        transform: function (doc, ret) {
            delete ret._id
            delete ret.__v
            delete ret.password
        }
    }
})

User.methods.isService = function() {
    return this.get('roles').indexOf('service') > -1
}

User.methods.isAdmin = function() {
    return this.get('roles').indexOf('admin') > -1
}

User.statics.validPassword = function(password, hash) {
    return bcrypt.compare(password, hash)
}

User.statics.hashPassword = function(password) {
    return bcrypt.hash(password, 10)
}

module.exports = mongoose.model('User', User)
