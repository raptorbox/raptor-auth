
const l = module.exports
const User = require('../models/user')

l.save = (u) => {
    return User.findOne({ username: u.username })
        .then((user) => {

            let hashPassword = false
            if(!user) {
                user = new User(u)
                hashPassword = true
            } else {
                if(u.password && user.password !== u.password) {
                    hashPassword = true
                }
                user = Object.assign(user, u)
            }

            let p = Promise.resolve()
            if (hashPassword) {
                p = User.hashPassword(u.password)
                    .then((hash) => {
                        user.password = hash
                        return Promise.resolve()
                    })
            }

            return p.then(() => user.save())
        })
}
