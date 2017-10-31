
const l = module.exports
const db = require('./index')
const logger = require('../logger')

const User = require('../models/user')

l.create = (raw) => {
    const user = new User(raw)
    return User.create(user)
}

l.update = (raw) => {
    let user = Object.assign({}, raw)
    if(raw._id) {
        user = Object.assign({}, raw._doc)
        delete user._id
    }
    return User.update({ username: user.username }, user)
}

l.read = (id) => {
    return User.findOne({ _id : id })
}

l.findOneByUsername = (username) => {
    return User.findOne({ username })
}
