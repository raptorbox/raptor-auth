

const oauth2orize = require('oauth2orize')
const passport = require('passport')
const Promise = require('bluebird')

const config = require('./config')
const api = require('./api')

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
                return Promise.all([Token.generate(), Token.generate()]).then((tks) => {

                    const tokenValue = tks[0]
                    const refreshTokenValue = tks[1]

                    const token = new Token({
                        token: tokenValue,
                        clientId: client.id,
                        userId: user.uuid,
                        type: 'oauth2',
                        expires: Date.now() + (config.oauth2.ttl*1000)
                    })

                    const refreshToken = new RefreshToken({
                        token: refreshTokenValue,
                        clientId: client.id,
                        userId: user.uuid
                    })

                    return refreshToken.save().then(() => {
                        const info = { scope: '*' }
                        return token.save().then(() => {
                            done(null, tokenValue, refreshTokenValue, { 'expires_in': config.oauth2.ttl })
                            return Promise.resolve()
                        })
                    })
                })
            })
        })
        .catch((e) => {
            done(e)
        })
}))

server.exchange(oauth2orize.exchange.clientCredentials(function(client, scope, done) {

    console.warn('**************************', client)

    if(!client) return done(null, false)

    Client.findOne({ id: client.id })
        .then((client) => {

            if (!client) {
                return done(null, false)
            }

            if(!client.enabled) {
                return done(null, false)
            }

            return Client.findOne({ uuid: client.userId }).then((user) => {
                if(!user.enabled) {
                    return done(null, false)
                }
                return Promise.resolve(user)
            }).then((user) => {
                return Promise.all([Token.generate(), Token.generate()]).then((tks) => {

                    const tokenValue = tks[0]
                    const refreshTokenValue = tks[1]

                    const token = new Token({
                        token: tokenValue,
                        clientId: client.id,
                        userId: user.uuid,
                        type: 'oauth2',
                        expires: Date.now() + (config.oauth2.ttl*1000)
                    })

                    const refreshToken = new RefreshToken({
                        token: refreshTokenValue,
                        clientId: client.id,
                        userId: user.uuid
                    })

                    return refreshToken.save().then(() => {
                        const info = { scope: '*' }
                        return token.save().then(() => {
                            done(null, tokenValue, refreshTokenValue, { 'expires_in': config.oauth2.ttl })
                            return Promise.resolve()
                        })
                    })
                })
            })
        })
        .catch((e) => {
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

        return User.findBy({ uuid: token.userId }).then((user) => {

            if (!user) {
                done(null, false)
                return Promise.resolve()
            }

            return Promise.all([
                RefreshToken.remove({ userId: user.uuid, clientId: client.id }),
                Token.remove({ userId: user.uuid, clientId: client.id })
            ]).then(() => {
                return Promise.all([Token.generate(), Token.generate()]).then((tks) => {

                    const tokenValue = tks[0]
                    const refreshTokenValue = tks[1]

                    const token = new Token({
                        token: tokenValue,
                        clientId: client.id,
                        userId: user.uuid
                    })

                    const refreshToken = new RefreshToken({
                        token: refreshTokenValue,
                        clientId: client.id,
                        userId: user.uuid
                    })

                    return refreshToken.save().then(() => {
                        var info = { scope: '*' }
                        return token.save(function () {
                            done(null, tokenValue, refreshTokenValue, { 'expires_in': config.oauth2.ttl })
                        })
                    })
                })
            })
        })
    })
        .catch((e) => done(e))
}))

// token endpoint
module.exports.token = [
    passport.authenticate(['basic', 'oauth2-client-password'], { session: false }),
    server.token(),
    server.errorHandler()
]
