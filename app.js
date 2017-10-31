
const config = require('./config')

const express = require('express')
const path = require('path')
const logger = require('./logger')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const errors = require('./errors')

const routes = require('./routes/index')
const User = require('./models/user')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(passport.initialize())

for (const path in routes) {
    app.use(`/${path}`, routes[path])
}

// passport config
passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {

        if (err) { return done(err) }

        if (!user) {
            return done(null, false)
        }

        User.validPassword(password, user.password)
            .then((valid) => {
                if(!valid) {
                    return done(null, false)
                }
                done(null, user)
            })
            .catch((e) => {
                done(e, false)
            })
    })
}))

passport.serializeUser(function(user, done) {
    done(null, user._id)
})

passport.deserializeUser(function(id, done) {
    User.findById(id)
        .then((user) => {
            done(null, user)
        })
        .catch((err) => {
            done(err, null)
        })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(new errors.NotFound())
})

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        const code = err.status || 500
        res.status(code)
        res.json({
            error: err,
            message: err.message,
            code,
        })
    })
} else {
    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        const code = err.status || 500
        res.status(code)
        res.json({
            message: err.message,
            code
        })
    })
}

module.exports = app
