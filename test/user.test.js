
const assert = require('chai').assert

const logger = require('../logger')
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

    describe('User API', function () {

        it('should create an user', function () {
            return util.getRaptor()
                .then(function (r) {
                    const u = util.newUser()
                    return r.Admin().User().create(u)
                })
        })

        it('should update an user', function () {
            return util.getRaptor()
                .then(function (r) {
                    const u = util.newUser()
                    return r.Admin().User().create(u)
                        .then((user) => {
                            user.password = 'p' + Date.now() * Math.random()
                            return r.Admin().User().update(user)
                        })
                })
        })

        it('should delete an user', function () {
            return util.getRaptor()
                .then(function (r) {
                    const u = util.newUser()
                    return r.Admin().User().create(u)
                        .then((user) => {
                            return r.Admin().User().delete(user.uuid)
                        })
                })
        })

    })
})
