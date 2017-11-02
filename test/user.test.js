
const assert = require('chai').assert
const util = require('./util')

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
