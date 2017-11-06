const bcrypt = require('bcrypt')
var mongoose = require('mongoose')
const Schema = mongoose.Schema

const errors = require('../errors')

const saltFactor = 10

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

User.plugin(require('./plugin/pager'))

User.pre('save', function(next) {
    var user = this

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next()

    bcrypt.hash(user.password, saltFactor)
        .then((hash) => {
            user.password = hash
            next()
        })
        .catch((e) => {
            next(e)
        })
})

// return self id (allow user to edit is own account)
User.methods.isOwner = function(user) {
    return this.uuid === user.uuid
}

User.methods.merge = function(u) {

    const user = this
    const model= this.model('User')

    return Promise.resolve()
        .then(() => {

            if (u.password) {
                user.password = u.password
            }

            if (u.roles) {
                user.roles = u.roles
            }

            if (u.fullName) {
                user.fullName = u.fullName
            }

            if (u.enabled !== undefined && u.enabled !== null) {
                user.enabled = u.enabled
            }

            return Promise.resolve()
        })
        .then(() => {
            if(u.username === user.username) {
                return Promise.resolve()
            }
            return model.findOne({ username: u.username })
                .then((user2) => {
                    if(user2) {
                        return Promise.reject(new errors.BadRequest('Username already taken'))
                    }

                    user.username = u.username
                    return Promise.resolve()
                })
        })
        .then(() => {
            if(u.email === user.email) {
                return Promise.resolve()
            }
            return model.findOne({ email: u.email })
                .then((user2) => {
                    if(user2) {
                        return Promise.reject(new errors.BadRequest('Email already registered'))
                    }
                    user.email = u.email
                    return Promise.resolve()
                })
        })
        .then(() => Promise.resolve(user))
}

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
    return bcrypt.hash(password, saltFactor)
}

module.exports = mongoose.model('User', User)
