const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const BearerStrategy = require('passport-http-bearer').Strategy

const errors = require('./errors')
const logger = require('./logger')

const routes = require('./routes/index')
const User = require('./models/user')
const Token = require('./models/token')

const app = express()

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use(passport.initialize())

//generate API docs
app.get('/swagger.json', function(req, res) {
    res.json(require('./swagger')())
})

// passport config
passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({ username: username }, function (err, user) {

        if (err) {
            return done(err)
        }

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

passport.use(new BearerStrategy(function(t, done) {
    Token.findOne({ token: t })
        .then((token) => {

            if (!token) {
                return done(null, false)
            }

            return User.findOne({ uuid: token.userId})
                .then((user) => {

                    if(user === null) {
                        return done(null, false)
                    }

                    if(!user.enabled) {
                        return done(null, false)
                    }

                    done(null, user, { token })
                })
        })
        .catch((e) => done(e, false))
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


for (const path in routes) {

    const isRoot = path === ''
    const subpath = isRoot ? '' : `/${path}`
    const subrouter = require('express-promise-router')()

    // check token only on subpath like user, role, token
    if(!isRoot) {
        subrouter.use(passport.authenticate('bearer', {
            failWithError: true,
            session: false
        }))
        subrouter.use(require('./authz').check({ type: path }))
    }
    routes[path].router(subrouter)

    app.use(`/auth${subpath}`, subrouter)
}

// last call catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(new errors.NotFound())
})

// error handlers
app.use(function(err, req, res, next) {

    if(err.message === 'Unauthorized') {
        err = new errors.Unauthorized()
    }

    err.code = err.code || 500
    res.status(err.code)
    res.json({
        message: err.message,
        code: err.code,
    })
})

module.exports = app
