
const logger = require('./logger')

let server = null

const start = () => {

    const config = require('./config')

    logger.level = config.logLevel || 'info'

    // mongoose
    logger.debug('Connecting to db')
    return require('./db').connect(config.mongodb)
        .then((db) => {
            logger.info('Running setup')
            return require('./setup').run()
        })
        .then(() => {
            logger.debug('Starting server')
            const app = require('./app')
            server = require('http').Server(app)
            return new Promise(function(resolve, reject) {
                server.listen(config.port, function(err) {
                    if(err) return reject(err)
                    logger.info(`Server listening on ::${config.port}`)
                    resolve()
                })
            })
        })
}

const stop = () => {
    return new Promise(function(resolve, reject) {
        if(server === null) return resolve()
        server.close(function(err) {
            if(err) return reject(err)
            logger.info('Server stopped')
            resolve()
        })
    }).then(() => {
        return require('./db').disconnect()
    })
}

module.exports.start = start
module.exports.stop = stop
