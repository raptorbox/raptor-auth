
let raptor

module.exports.client = () => raptor

module.exports.initialize = () => {

    const config = require('./config')
    const Raptor = require('raptor-sdk')

    raptor = new Raptor({
        url: config.url,
        token: config.token,
    })
    raptor.Auth().setUser(config.service)

    require('./logger').debug('Initialized API client')

    return Promise.resolve()
}
