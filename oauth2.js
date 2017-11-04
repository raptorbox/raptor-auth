

const oauth2orize = require('oauth2orize')
const passport = require('passport')
const Promise = require('bluebird')

const config = require('./config')
const api = require('./api')
const logger = require('./logger')

const Client = api.models.Client
const User = api.models.User
const Token = api.models.Token
const RefreshToken = api.models.RefreshToken

// create OAuth 2.0 server
var server = oauth2orize.createServer()

server.serializeClient(function(client, done) {
    return done(null, client.id)
})

server.deserializeClient(function(id, done) {
    Client.findOne({ id })
        .then((client) => {
            done(null, client)
        })
        .catch((e) => done(e))
})

// Exchange username & password for an access token.
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
    User.findOne({ username: username })
        .then((user) => {

            if (!user) {
                return done(null, false)
            }

            return user.validPassword(password).then((valid) => {

                if(!valid) {
                    return done(null, false)
                }

                return Promise.all([
                    RefreshToken.remove({ userId: user.uuid, clientId: client.id }),
                    Token.remove({ userId: user.uuid, clientId: client.id })
                ])
            }).then(() => {

                const token = new Token({
                    name: 'at',
                    clientId: client.id,
                    userId: user.uuid,
                    type: 'oauth2',
                    expires: Date.now() + (config.oauth2.ttl*1000)
                })

                const refreshToken = new RefreshToken({
                    clientId: client.id,
                    userId: user.uuid
                })

                return refreshToken.save().then(() => {
                    const info = { scope: '*' }
                    return token.save().then(() => {
                        done(null, token.token, refreshToken.token, { 'expires_in': config.oauth2.ttl })
                        return Promise.resolve()
                    })
                })
            })
        })
        .catch((e) => {
            logger.warn('Password exchange error: %s', e.message)
            logger.debug(e.stack)
            done(e)
        })
}))

server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {

    if(!client) return done(null, false)

    Client.findOne({ id: client.id })
        .then((client) => {

            if (!client) {
                return done(null, false)
            }

            if(!client.enabled) {
                return done(null, false)
            }

            return Promise.all([
                RefreshToken.remove({ userId: client.userId, clientId: client.id }),
                Token.remove({ userId: client.userId, clientId: client.id })
            ])
        }).then(() => {

            const token = new Token({
                name: 'at',
                clientId: client.id,
                userId: client.userId,
                type: 'oauth2',
                expires: Date.now() + (config.oauth2.ttl*1000)
            })

            const refreshToken = new RefreshToken({
                clientId: client.id,
                userId: client.userId
            })

            return refreshToken.save().then(() => {
                return token.save().then(() => {
                    done(null, token.token, refreshToken.token, { 'expires_in': config.oauth2.ttl })
                    return Promise.resolve()
                })
            })
        })
        .catch((e) => {
            logger.warn('Client credentials exchange error %s', e.message)
            logger.debug(e.stack)
            done(e)
        })
}))

// Exchange refreshToken for an access token.
server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
    RefreshToken.findOne({ token: refreshToken }).then((token) => {

        if (!token) {
            done(null, false)
            return Promise.resolve()
        }

        return api.models.User.findOne({ uuid: token.userId }).then((user) => {

            if (!user) {
                done(null, false)
                return Promise.resolve()
            }

            return Promise.all([
                RefreshToken.remove({ userId: user.uuid, clientId: client.id }),
                Token.remove({ userId: user.uuid, clientId: client.id })
            ]).then(() => {

                const token = new Token({
                    name: 'at',
                    clientId: client.id,
                    userId: user.uuid
                })

                const refreshToken = new RefreshToken({
                    clientId: client.id,
                    userId: user.uuid
                })

                return refreshToken.save().then(() => {
                    return token.save(function () {
                        done(null, token.token, refreshToken, { 'expires_in': config.oauth2.ttl })
                    })
                })
            })
        })
    })
        .catch((e) => done(e))
}))

// token endpoint
module.exports.token = [
    passport.authenticate(['client_basic', 'client_password'], { session: false }),
    server.token(),
    server.errorHandler()
]
