
const assert = require('chai').assert
const util = require('./util')
const Raptor = require('raptor-sdk')

const createClient = (r) => {
    return r.Admin().Client().create(util.randomName('client')).then((client) => {
        return r.Admin().Client().read(client)
    })
}

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
                    return createClient(adm)
                })
        })

        it('should retrieve a token', function () {
            return util.getRaptor()
                .then((adm) => {
                    return createClient(adm)
                        .then((client) => {
                            const r = new Raptor({
                                url: adm.getConfig().url,
                                clientId: client.id,
                                clientSecret: client.secret
                            })
                            return r.Auth().login()
                        })
                })
        })

        it('should refresh a token', function () {
            return util.getRaptor()
                .then((adm) => {
                    return createClient(adm)
                        .then((client) => {
                            const r = new Raptor({
                                url: adm.getConfig().url,
                                clientId: client.id,
                                clientSecret: client.secret
                            })
                            return r.Auth().login()
                                .then(() => {
                                    return r.Auth().refreshToken()
                                })
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
