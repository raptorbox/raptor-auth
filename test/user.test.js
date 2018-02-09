
const assert = require('chai').assert
const util = require('./util')
const Promise = require('bluebird')

describe('auth service', function () {


    before(util.before)
    after(util.after)


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
                            return r.Admin().User().delete(user.id)
                        })
                })
        })

        it('should list users', function () {
            return util.getRaptor()
                .then(function (r) {
                    const users = []
                    for(let i = 0; i < 15; i++) {
                        const u = util.newUser()
                        u.username += '___' + i
                        users.push(r.Admin().User().create(u))
                    }

                    const size = 5
                    const page = 0
                    let sort = 'created'
                    let sortDir = 'desc'
                    return Promise.all(users)
                        .then(() => r.Admin().User().list({}, { page, size, sort, sortDir }))
                        .then((pager) => {

                            assert.equal(pager.getContent().length, size)
                            assert.equal(pager.getNumberOfElements(), size)
                            assert.isTrue(pager.getContent().filter((u) => 'service' === u.username).length === 0)

                            const u1 = pager.getContent()[0]
                            const p = u1.username.split('___')
                            assert.isTrue(p.length === 2)
                            assert.isTrue(p[1] > 0 && p[1] < 15)

                            return Promise.resolve()
                        })
                })
        })

        // it('should delete test users', function () {
        //     return util.getRaptor()
        //         .then(function (r) {
        //             const size = 1000
        //             const page = 0
        //             let sort = 'created'
        //             let sortDir = 'desc'
        //             return r.Admin().User().list({}, { page, size, sort, sortDir })
        //                 .then((pager) => {

        //                     pager.getContent().forEach(function(e){
        //                         if(e.username.indexOf('test') > -1 ) {
        //                             r.Admin().User().delete(e.id)
        //                         }
        //                     })
        //                     return Promise.resolve()
        //                 })
        //         })
        // })

    })
})
