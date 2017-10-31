var express = require('express')
var passport = require('passport')
var User = require('../models/user')
var errors = require('../errors')

var router = express.Router()

router.get('/', function (req, res) {
    res.render('index', { user : req.user })
})

// router.post('/register', function(req, res) {
//     User.register(new User({
//         username : req.body.username
//     }), req.body.password, function(err, user) {
//
//         if (err) {
//             return res.json(new errors.InternalServerError(err))
//         }
//
//         passport.authenticate('local')(req, res, function () {
//             res.json({
//                 token: '',
//                 expires: 0,
//                 user
//             })
//         })
//     })
// })

router.post('/login', passport.authenticate('local'), function(req, res) {
    res.json({
        token: '',
        expires: 0,
        user: req.user,
    })
})

router.get('/logout', function(req, res) {
    // drop token
    req.logout()
    res.send(202)
})

router.post('/refresh', function(req, res){
    res.json({
        token: '',
        expires: ''
    })
})

module.exports = router
