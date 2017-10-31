var mongoose = require('mongoose')
var Schema = mongoose.Schema

var Token = new Schema({
    token: String,
    secret: String,
    enabled: Boolean,
    expires: Date,
    userId: String
})

module.exports = mongoose.model('Token', Token)
