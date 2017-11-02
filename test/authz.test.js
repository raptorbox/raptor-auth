
const assert = require('chai').assert
const util = require('./util')

describe('auth service', function () {

    before(function () {
        return require('../index').start()
    })
    after(function () {
        return require('../index').stop()
    })

    describe('authorization API', function () {

        it('should allow read', function () {
            return util.getRaptor()
                .then((adm) => {
                    return util.createUserInstance()
                        .then(function (usr) {
                            return adm.Admin().Role()
                                .create({
                                    name: 'test',
                                    permissions: [
                                        'admin_device',
                                    ]
                                })
                                .then((role) => {
                                    const u1 = usr.Auth().getUser()
                                    u1.roles.push(role.name)
                                    return adm.Admin().User().update(u1)
                                })
                                .then(() => {
                                    return usr.Auth()
                                        .can('device', 'read')
                                        .then((res) => {
                                            assert.isTrue(res.result)
                                            return Promise.resolve()
                                        })
                                })
                        })
                })
        })

        it('should enforce ACL', function () {
            return util.getRaptor()
                .then((adm) => {
                    return util.createUserInstance()
                        .then(function (usr) {
                            return adm.Auth().sync({
                                type: 'device',
                                permission: 'update',
                                subjectId: 'foo9000',
                                userId: usr.Auth().getUser().uuid
                            })
                                .then(() => {
                                    return usr.Auth()
                                        .can('device', 'update', 'foo9000')
                                        .then((res) => {
                                            assert.isTrue(res.result)
                                            return Promise.resolve()
                                        })
                                })
                        })
                })
        })

    })
})
