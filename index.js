
const logger = require('./logger')
const mongoose = require('mongoose')

let server = null

const checkDBConnection = () => {
    setInterval(function() {
        const config = require('./config')
        let state = mongoose.connection.readyState
        if(state == 0) {
            logger.info('==== MongoDB Disconnected, Reconnecting... ====')
            require('./db').connect(config.mongodb).then(() => {
                logger.info('==== MongoDB Connected again ====')
            })
        } else if (state == 1) {
            logger.info('==== MongoDB Connected ====')
        } else if (state == 2) {
            logger.info('==== MongoDB Connecting ====')
        } else if (state == 3) {
            logger.info('==== MongoDB disconnecing ====')
        } else if (state == 4) {
            logger.info('==== MongoDB Unauthorized ====')
        } else if (state == 99) {
            logger.info('==== MongoDB Unintialized ====')
        } 
    }, 1 * 30 * 60 * 1000 )
    // }, 5 * 1000 )
}

// const disconnectDB = () => {
//     setInterval(function() {
//         require('./db').disconnect().then(() => {
//             logger.info('Disconnected')
//         })
//     }, 20 * 1000 )
// }

const start = () => {

    const config = require('./config')

    logger.level = process.env.LOG_LEVEL || config.logLevel || 'info'

    checkDBConnection()
    // disconnectDB()
    
    // mongoose
    logger.debug('Connecting to db')
    return require('./db').connect(config.mongodb)
        .then(() => {
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
    })
        .then(() => {
            return require('./db').disconnect()
        })
        .then(() => {
            return require('./broker').close()
        })
        .then(() => {
            return require('./cache').close()
        })
}

module.exports.start = start
module.exports.stop = stop
