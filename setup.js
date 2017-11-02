
const Promise = require('bluebird')
const logger = require('./logger')
const config = require('./config')
const api = require('./api')

module.exports.run = () => {
    return createDefaultUsers()
        .then(createDefaultRoles)
}

const createDefaultUsers = () => {
    return Promise.all(Object.keys(config.users).map((k) => config.users[k]))
        .each(api.User.save)
        .then(() => {
            logger.debug('Stored default users')
            return Promise.resolve()
        })
}

const createDefaultRoles = () => {
    return Promise.all(Object.keys(config.roles).map((k) => config.roles[k]))
        .each((r) => {
            return api.Role.save(r)
        })
        .then(() => {
            logger.debug('Stored default roles')
            return Promise.resolve()
        })
}
