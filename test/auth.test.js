
const assert = require('chai').assert

// process.env.TESTCONFIG = "./config.json"
const logger = require('../logger')
const Raptor = require('raptor-sdk')
const config = require('../config/auth.json')
const util = require('./util')

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
            return util.getRaptor()
                .then(function (r) {

                    const u = r.Auth().getUser()
                    const token = r.Auth().getToken()

                    logger.debug('Logged in %s [%s]', u, token)

                    assert.isTrue(u && u.username === 'admin')
                    assert.isTrue(token && token.length > 0)

                    return Promise.resolve()
                })
        })

        it('should logout', function () {
            return util.createUserInstance()
                .then(r => r.Auth().logout())
        })

        // it('should login again and use a different token', function () {
        //     return r.auth.logout()
        //         .then(function () {
        //             assert.isTrue(r.auth.currentToken() === null)
        //             assert.isTrue(r.auth.currentUser() === null)
        //             return r.auth.login().then(function () {
        //                 return loadAuthToken().then(function (token2) {
        //                     assert.notEqual(token.id, token2.id)
        //                     return Promise.resolve()
        //                 })
        //             })
        //         })
        // })
        //
        // it('should login again and have just one login token', function () {
        //     return r.auth.logout()
        //         .then(function () {
        //             return r.auth.login().then(function () {
        //                 return listAuthTokens()
        //                     .then(function (logins) {
        //                         d('Login tokens %j', logins)
        //                         assert.equal(logins.length, 1)
        //                         return Promise.resolve()
        //                     })
        //             })
        //         })
        // })
        //
        // it('should refresh the auth token and still have on token avail', function () {
        //     return r.auth.login()
        //         .then(function () {
        //             return r.auth.refreshToken()
        //                 .then(listAuthTokens)
        //                 .then(function (logins) {
        //                     assert.equal(logins.length, 1)
        //                     return Promise.resolve()
        //                 })
        //         })
        // })


    })
})
