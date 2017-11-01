
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
                .then(r => {
                    const token = r.Auth().getToken()
                    return r.Auth().logout()
                        .then(() => (new Raptor({
                            url: r.getConfig().url,
                            token
                        })).Auth().login()
                            .catch(() => Promise.resolve()))
                })
        })

        it('should refresh token', function () {
            return util.createUserInstance()
                .then((r) => {
                    const t1 = r.Auth().getToken()
                    return r.Auth().refreshToken()
                        .then(function () {
                            assert.notEqual(t1, r.Auth().getToken())
                            return Promise.resolve()
                        })
                })
        })

    })
})
