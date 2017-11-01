const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const errors = require('./errors')
const logger = require('./logger')

const routes = require('./routes/index')
const User = require('./models/user')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(passport.initialize())

//generate API docs
app.get('/swagger.json', function(req, res) {
    res.json(require('./swagger')())
})

for (const path in routes) {
    const p = path === '' ? '' : `/${path}`
    logger.debug(`Registered /auth${p} endpoint`)
    app.use(`/auth${p}`, routes[path])
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

// last call catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(new errors.NotFound())
})

// error handlers

// development error handler, with stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        const code = err.code || 500
        res.status(code)
        const r = err.toJSON ? err.toJSON() : {
            error: err,
            message: err.message,
            code,
        }
        res.json(r)
    })
} else {
    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        const code = err.status || 500
        res.status(code)
        const r = err.toJSON ? err.toJSON() : {
            message: err.message,
            code
        }
        res.json(r)
    })
}

module.exports = app
