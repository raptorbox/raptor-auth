
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

        it('should allow create user', function () {
            return util.getRaptor()
                .then((adm) => {
                    return util.createUserInstance()
                        .then(function (usr) {
                            return adm.Admin().Role()
                                .create({
                                    name: 'admin_own_user',
                                    permissions: [
                                        'admin_own_user',
                                    ]
                                })
                                .then((role) => {
                                    const u1 = usr.Auth().getUser()
                                    u1.roles.push(role.name)
                                    return adm.Admin().User().update(u1)
                                })
                                .then(() => {
                                    return usr.Auth()
                                        .can('user', 'create')
                                        .then((res) => {
                                            assert.isTrue(res.result)
                                            return Promise.resolve()
                                        })
                                })
                        })
                })
        })

        it('check read own user permission', function () {
            return util.getRaptor()
                .then((adm) => {
                    return util.createUserInstance()
                        .then(function (usr) {
                            return adm.Admin().Role()
                                .create({
                                    name: 'admin_own_user',
                                    permissions: [
                                        'admin_own_user',
                                    ]
                                })
                                .then((role) => {
                                    const u1 = usr.Auth().getUser()
                                    u1.roles.push(role.name)
                                    return adm.Admin().User().update(u1)
                                })
                                .then(() => {
                                    return usr.Auth()
                                        .can('user', 'read')
                                        .then((res) => {
                                            assert.isTrue(res.result)
                                            return Promise.resolve()
                                        })
                                })
                        })
                })
        })

        it('should allow read own user', function () {
            return util.getRaptor()
                .then((adm) => {
                    return util.createUserInstance()
                        .then(function (usr) {
                            return adm.Admin().Role()
                                .create({
                                    name: 'admin_own_user',
                                    permissions: [
                                        'admin_own_user',
                                    ]
                                })
                                .then((role) => {
                                    const u1 = usr.Auth().getUser()
                                    u1.roles.push(role.name)
                                    return adm.Admin().User().update(u1)
                                })
                                .then(() => {
                                    const u1 = usr.Auth().getUser()
                                    const u = util.newUserWithOwnerId(u1.id)
                                    return usr.Admin().User().create(u)
                                })
                                .then(() => {
                                    const u1 = usr.Auth().getUser()
                                    const u = util.newUserWithOwnerId(u1.id)
                                    return usr.Admin().User().create(u)
                                })
                                .then(() => {
                                    const u1 = usr.Auth().getUser()
                                    return usr.Admin().User().list({ownerId: u1.id})
                                        .then((res) => {
                                            assert.equal(res.json.content.length, 2)
                                            return Promise.resolve()
                                        })
                                })
                        })
                })
        })

        it('should allow delete own user', function () {
            return util.getRaptor()
                .then((adm) => {
                    return util.createUserInstance()
                        .then(function (usr) {
                            return adm.Admin().Role()
                                .create({
                                    name: 'admin_own_user',
                                    permissions: [
                                        'admin_own_user',
                                    ]
                                })
                                .then((role) => {
                                    const u1 = usr.Auth().getUser()
                                    u1.roles.push(role.name)
                                    return adm.Admin().User().update(u1)
                                })
                                // create user 1
                                .then(() => {
                                    const u1 = usr.Auth().getUser()
                                    const u = util.newUserWithOwnerId(u1.id)
                                    return usr.Admin().User().create(u)
                                        .then((user) => {
                                            return Promise.resolve(user)
                                        })
                                })
                                // create user 2
                                .then(() => {
                                    const u1 = usr.Auth().getUser()
                                    const u = util.newUserWithOwnerId(u1.id)
                                    return usr.Admin().User().create(u)
                                })
                                // list user
                                .then(() => {
                                    const u1 = usr.Auth().getUser()
                                    return usr.Admin().User().list({ownerId: u1.id})
                                        .then((res) => {
                                            return Promise.resolve(res)
                                        })
                                })
                                // delete user
                                .then((users) => {
                                    const u1 = usr.Auth().getUser()
                                    // , domain: this.appId
                                    let query = {ownerId: u1.id}
                                    return usr.Admin().User().delete(users.json.content[0].id, query)
                                        .then(() => {
                                            assert.equal(users.json.content.length, 2)
                                            return Promise.resolve()
                                        })
                                })
                        })
                })
        })

        // it('should allow delete own user with app', function () {
        //     return util.getRaptor().then((adm) => {
        //         return util.createUserInstance()
        //             .then(function (usr) {
        //                 const u = util.newUser()
        //                 return adm.Admin().User().create(u)
        //                     .then((user) => {
        //                         assert.equal(JSON.stringify(user), 1)
        //                         return adm.App().create({
        //                             name: util.randomName('app'),
        //                             role: [{name: 'admin_own_user', permissions: ['admin_own_user']}],
        //                             users: [
        //                                 { id: user.id, role: ['admin_own_user'] }
        //                             ]
        //                         }).then((app) => {
        //                             assert.equal(app.json, 1)
        //                             const u1 = usr.Auth().getUser()
        //                             const u = util.newUserWithOwnerId(u1.id)
        //                             return usr.Admin().User().create(u)
        //                                 .then((res) => {
        //                                     assert.equal(res.json, 1)
        //                                     return Promise.resolve(app)
        //                                 })
        //                         }).then((app) => {
        //                             const u1 = usr.Auth().getUser()
        //                             return usr.Admin().User().list({ownerId: u1.id})
        //                                 .then((res) => {
        //                                     assert.equal(res.json.content.length, 1)
        //                                     return Promise.resolve(res)
        //                                 })
        //                         }).then((users) => {
        //                             const u1 = usr.Auth().getUser()
        //                             // , domain: this.appId
        //                             let query = {ownerId: u1.id}
        //                             return usr.Admin().User().delete(users.json.content[0].id, query)
        //                                 .then(() => {
        //                                     assert.equal(users.json.content.length, 1)
        //                                     return Promise.resolve()
        //                                 })
        //                         })
        //                     })
        //             })
        //     })
        // })

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

        it('should check a token permission before performing operation', function () {
            return util.getRaptor()
                .then((adm) => {
                    const tokenName = util.randomName('token')
                    const tok = {
                        name: tokenName,
                        secret: tokenName + '_foobar',
                        expires: 1895316383000
                    }
                    return adm.Admin().Token()
                        .create(tok)
                        .then((token) => {
                            return adm.Admin().Token().Permission().set(token,['read_user'])
                                // .then(() => {
                                //     return adm.Admin().Token().read(token)
                                //         .then((res) => {
                                //             assert.equal(res.name, tok.name)
                                //             return Promise.resolve()
                                //         })
                                // })
                                .then(() => {
                                    return adm.Admin().User().list()
                                        .then((res) => {
                                            // assert.isTrue(res.json.content.length > 0)
                                            return Promise.resolve(res.getContent().length)
                                        })
                                        .then((res) => {
                                            return util.loginWithToken(token.token)
                                                .then((rap) => {
                                                    return rap.Admin().User().list()
                                                        .then((response) => {
                                                            assert.equal(response.getContent().length, res)
                                                            return Promise.resolve()
                                                        })
                                                })
                                        })
                                })
                        })
                })
        })

        it('should be false when token does not has permission', function () {
            return util.getRaptor()
                .then((adm) => {
                    const tokenName = util.randomName('token')
                    const tok = {
                        name: tokenName,
                        secret: tokenName + '_foobar',
                        expires: 1895316383000
                    }
                    return adm.Admin().Token()
                        .create(tok)
                        .then((token) => {
                            return adm.Admin().Token().Permission().set(token,['read_device'])
                                .then(() => {
                                    return Promise.resolve(token)
                                })
                        }).then((token) => {
                            return util.loginWithToken(token.token)
                                .then((rap) => {
                                    return rap.Admin().User().list()
                                        .then((response) => {
                                            assert.equal(response.getContent().length, 0)
                                            return Promise.resolve()
                                        })
                                        .catch((e) => {
                                            assert.equal(e.code, 403)
                                        })
                                })
                        })
                })
        })

        // it('should check a specific token permission', function () {
        //     // let token = '$2a$10$OamPL.s.GRZ/qAXlbTAGiesNuHoFQ4F8b3l/MmTppmIOidK2VzlCS'
        //     let token = '$2a$10$uR7kqtYU1bLv702xZrAnmuh6nHMD50x5MvYnBwcaK6fEnCA3thzlq'
        //     return util.loginWithToken(token)
        //         .then((rap) => {
        //             return rap.Admin().Token().read(token)
        //                 .then((res) => {
        //                     assert.equal(JSON.stringify(res), 2)
        //                     return Promise.resolve()
        //                 })
        //             // return rap.Admin().User().list()
        //             //     .then((res) => {
        //             //         assert.equal(JSON.stringify(res.json.content), 2)
        //             //         return Promise.resolve()
        //             //     })
        //         })
        // })

    })
})
