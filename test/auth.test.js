
const assert = require('chai').assert

// process.env.TESTCONFIG = "./config.json"
const logger = require('../logger')
const Raptor = require('raptor-sdk')
const config = require('../config/auth.json')

logger.level = 'debug'

config.mongodb.url = config.mongodb.url.replace('auth', 'auth_test')

config.sdk = {
    url: `http://localhost:${config.port}`,
    username: config.users.admin.username,
    password: config.users.admin.password
}


describe('auth service', function () {

    before(function () {
        return require('../index').start()
    })
    after(function () {
        return require('../index').stop()
    })

    describe('authentication API', function () {

        it('should login as admin', function () {
            const r = new Raptor(config.sdk)
            return r.Auth().login()
                .then(function (user) {

                    logger.debug('Logged in %j', user)

                    const u = r.Auth().getUser()
                    const token = r.Auth().getToken()

                    assert.isTrue(u && u.username === 'admin')
                    assert.isTrue(token && token.length > 0)

                    return Promise.resolve()
                })
        })

        it('should retrieve the token', function () {
            return loadAuthToken()
                .then(function (token2) {
                    token = token2
                    assert.isTrue(token.token === r.auth.currentToken())
                    return Promise.resolve()
                })
        })

        it('should login again and use a different token', function () {
            return r.auth.logout()
                .then(function () {
                    assert.isTrue(r.auth.currentToken() === null)
                    assert.isTrue(r.auth.currentUser() === null)
                    return r.auth.login().then(function () {
                        return loadAuthToken().then(function (token2) {
                            assert.notEqual(token.id, token2.id)
                            return Promise.resolve()
                        })
                    })
                })
        })

        it('should login again and have just one login token', function () {
            return r.auth.logout()
                .then(function () {
                    return r.auth.login().then(function () {
                        return listAuthTokens()
                            .then(function (logins) {
                                d('Login tokens %j', logins)
                                assert.equal(logins.length, 1)
                                return Promise.resolve()
                            })
                    })
                })
        })

        it('should refresh the auth token and still have on token avail', function () {
            return r.auth.login()
                .then(function () {
                    return r.auth.refreshToken()
                        .then(listAuthTokens)
                        .then(function (logins) {
                            assert.equal(logins.length, 1)
                            return Promise.resolve()
                        })
                })
        })


    })
})
