
const Promise = require('bluebird')

module.exports.run = () => {
    return createDefaultUsers()
}

const createDefaultUsers = () => {

    const logger = require('./logger')
    const config = require('./config')
    const db = require('./db')

    return Promise.all(Object.keys(config.users).map((k) => config.users[k]))
        .each((u) => {
            return db.User.findOneByUsername(u.username)
                .then((user) => {
                    if(!user) {
                        return db.User.create(u)
                    }
                    return db.User.update(u)
                })
        })
        .then(() => {
            logger.info('Stored default users')
            return Promise.resolve()
        })
}
