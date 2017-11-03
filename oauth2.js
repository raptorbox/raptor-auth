
const oauth2orize = require('oauth2orize')
const Promise = require('bluebird')

const config = require('./config')
const api = require('./api')

const User = api.models.User
const Token = api.models.Token
const RefreshToken = api.models.RefreshToken

// create OAuth 2.0 server
var server = oauth2orize.createServer()

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
    server.token(),
    server.errorHandler()
]
