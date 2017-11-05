
const Promise = require('bluebird')
const logger = require('./logger')
const config = require('./config')
const api = require('./api')

module.exports.run = () => {
    return Promise.resolve()
        .then(() => Promise.resolve(require('./broker').connect()))
        .then(() => require('./cache').initialize())
        .then(createDefaultUsers)
        .then(createDefaultRoles)
        .then(createDefaultToken)
        .then(require('./raptor').initialize)
}

const createDefaultUsers = () => {
    return Promise.all(Object.keys(config.users).map((k) => config.users[k]))
        .each((u) => api.User.save(u))
        .then((u) => {

            // store service user service as config
            if (u.username === config.users.service.username) {
                config.service = u
            }

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

const createDefaultToken = () => {
    return api.User.read({ username: 'service' })
        .then((u) => {
            return api.models.Token.findOne({ name: 'service-default', userId: u.uuid })
                .then((token) => {
                    if(token) {
                        return Promise.resolve(token)
                    }
                    const t = new api.models.Token({
                        name: config.serviceToken,
                        expires: 0,
                        enabled: true,
                        userId: u.uuid
                    })
                    return t.save()
                })
        })
        .then((token) => {
            config.token = token
            logger.debug('Created token `%s` [type=%s expires=%s]', token.name, token.type, token.expires)
            return Promise.resolve()
        })
}
