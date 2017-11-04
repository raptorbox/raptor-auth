const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RefreshToken = new Schema({
    userId: {
        type: String,
        required: true
    },
    clientId: {
        type: String,
        required: true
    },
    token: {
        type: String,
        index: true,
        unique: true,
        required: false,
    },
    secret: {
        type: String,
        required: true,
    },
    created: {
        type: Date,
        default: Date.now
    }
})

RefreshToken.plugin(require('../plugin/token'))

module.exports = mongoose.model('RefreshToken', RefreshToken)
