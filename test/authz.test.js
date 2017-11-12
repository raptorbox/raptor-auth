
const assert = require('chai').assert
const util = require('./util')

describe('auth service', function () {


    before(util.before)
    after(util.after)


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

        it('should check a token', function () {
            return util.getRaptor()
                .then((adm) => {
                    return util.createUserInstance()
                        .then(function (usr) {
                            return adm.Admin().Token()
                                .check({
                                    token: usr.Auth().getToken(),
                                })
                                .then((usr1) => {
                                    assert.equal(usr1.id, usr.Auth().getUser().id)
                                    return Promise.resolve()
                                })
                        })
                })
        })
    })
})
