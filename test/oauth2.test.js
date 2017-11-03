
const assert = require('chai').assert
const util = require('./util')

describe('auth service', function () {

    before(function () {
        return require('../index').start()
    })
    after(function () {
        return require('../index').stop()
    })

    describe('OAuth2 API', function () {

        it('should create a client', function () {
            return util.getRaptor()
                .then((adm) => {
                    return adm.Admin().Client().create({
                        name: util.randomName('client')
                    }).then((client) => {
                        return adm.Admin().Client().read(client)
                    })
                })
        })

        it('should update a client', function () {
            return util.getRaptor()
                .then((adm) => {
                    return adm.Admin().Client().create({
                        name: util.randomName('client')
                    }).then((client) => {
                        client.secret = 'foo'
                        client.enabled = false
                        return adm.Admin().Client().update(client)
                    })
                        .then((client) => adm.Admin().Client().read(client))
                        .then((client) => {
                            assert.equal(client.secret, 'foo')
                            assert.equal(client.enabled, false)
                            return Promise.resolve()
                        })
                })
        })

        it('should delete a client', function () {
            return util.getRaptor()
                .then((adm) => {
                    return adm.Admin().Client().create({
                        name: util.randomName('client')
                    })
                        .then((client) => adm.Admin().Client().delete(client)
                            .then(() => adm.Admin().Client().read(client))
                        )
                        .catch(() => Promise.resolve())
                })
        })

    })
})
