
const assert = require('chai').assert
const util = require('./util')

const newToken = (exp) => {
    return {
        name: util.randomName(),
        secret: 'shh' + util.randomName(),
        expires: exp || null,
    }
}

describe('auth service', function () {

    before(function () {
        return require('../index').start()
    })
    after(function () {
        return require('../index').stop()
    })

    describe('Token API', function () {

        it('should create a token', function () {
            return util.getRaptor()
                .then(function (r) {
                    const t = newToken()
                    return r.Admin().Token().create(t)
                        .then((token) => r.Admin().Token().read(token))
                })
        })

        it('should update a token', function () {
            return util.getRaptor()
                .then(function (r) {
                    const t = newToken()
                    return r.Admin().Token().create(t)
                        .then((token) => {
                            token.secret = '42'
                            return r.Admin().Token().update(token)
                                .then((token2) => {
                                    assert.equal('42', token2.secret)
                                    assert.notEqual(token.token, token2.token)
                                    return Promise.resolve()
                                })
                        })
                })
        })

        it('should delete a token', function () {
            return util.getRaptor()
                .then(function (r) {
                    const t = newToken()
                    return r.Admin().Token().create(t)
                        .then((token) => {
                            return r.Admin().Token().delete(token)
                                .then(() => {
                                    return r.Admin().Token().read(token)
                                        .catch((e) => {
                                            assert.equal(404, e.code)
                                            return Promise.resolve()
                                        })
                                })
                        })
                })
        })

    })
})
