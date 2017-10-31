
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')

const config = require('../config')

let db = null

module.exports.conn = () => {
    if (db === null) throw new Error('db must be initialized, call `db.connect()` first')
    return db
}

//http://mongoosejs.com/docs/connections.html#use-mongo-client
module.exports.connect = () => {
    if(db === null) {
        return mongoose.connect(
            config.mongodb.url, {
                useMongoClient: true,
                promiseLibrary: mongoose.Promise
            })
            .then((conn) => {
                db = conn
                return Promise.resolve(db)
            })
    }
    return Promise.resolve(db)
}

module.exports.disconnect = () => {
    if(db === null) {
        return Promise.resolve()
    }
    return db.close()
        .then(() => {
            db = null
            return Promise.resolve()
        })
}
