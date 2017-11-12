
const assert = require('chai').assert
const util = require('./util')

const newRole = () => {
    return {
        name: 'role_' + util.randomName(),
        permissions: [
            'admin_device',
            'workflow_read'
        ]
    }
}

describe('auth service', function () {

    before(util.before)
    after(util.after)


    describe('Role API', function () {

        it('should create a role', function () {
            return util.getRaptor()
                .then(function (r) {
                    const role = newRole()
                    return r.Admin().Role().create(role)
                        .then((role)=> {
                            return r.Admin().Role().read(role)
                        })
                })
        })

        it('should update a role', function () {
            return util.getRaptor()
                .then(function (r) {
                    const role = newRole()
                    return r.Admin().Role().create(role)
                        .then((role) => {
                            role.permissions.push('eat')
                            return r.Admin().Role().update(role)
                        })
                        .then((role2) => {
                            assert.isTrue(role2.permissions.indexOf('eat') > -1)
                            return Promise.resolve()
                        })
                })
        })

        it('should delete a role', function () {
            return util.getRaptor()
                .then(function (r) {
                    const role = newRole()
                    return r.Admin().Role().create(role)
                        .then((role) => {
                            return r.Admin().Role().delete(role)
                        })
                        .then(() => {
                            return r.Admin().Role().read(role)
                                .catch((e) => {
                                    assert.equal(404, e.code)
                                    return Promise.resolve()
                                })
                        })
                })
        })

    })
})
