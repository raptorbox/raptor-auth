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


User.methods.merge = function(u) {
    const user = this

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
            return user.findOne({ username: u.username })
                .then((user2) => {
                    if(user2) {
                        return Promise.reject(new errors.BadRequest('Username already taken'))
                    }

                    user.username = u.username
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

User.statics.findPaged = function(query, paging) {

    const M = User

    query = query || {}
    paging = paging || {}

    // validate input
    if (paging.size && (paging.size*1 != paging.size)) {
        paging.size = null
    }
    if(paging.size > 1000) {
        paging.size = 1000
    }
    if (paging.page && (paging.page*1 != paging.page)) {
        paging.page = null
    }
    if (paging.sort && (typeof paging.sort !== 'string' || paging.sort.length > 18)) {
        paging.sort = null
    }

    const page = Math.max(0, paging.page - 1) // using a zero-based page index for use with skip()
    const size = paging.size || 50

    let sort = paging.sort || { '_id': 1 }
    if(typeof sort === 'string') {
        let s = {}
        s[sort] = 1
        sort = s
    }

    return M.find(query).count()
        .then((len) => {
            return M.find(query)
                .sort(sort)
                .skip(page * size)
                .limit(size)
                .exec()
                .then((records) => {
                    return Promise.resolve({
                        total: len,
                        page: page,
                        size: size,
                        sort: sort,
                        content: records
                    })
                })
        })
}

module.exports = mongoose.model('User', User)
