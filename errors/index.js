const lib = module.exports

const HttpError = function(message, code) {
    Error.call(this)
    Error.captureStackTrace(this, arguments.callee)
    this.name = 'HttpError'
    this.message = message || 'Internal Server Error'
    this.code = code || 500
}

HttpError.prototype.__proto__ = Error.prototype

HttpError.prototype.toJSON = function() {
    return {
        code: this.code,
        message: this.message
    }
}


const createErrorType = (name, code, defaultMessage) => {

    const err = function(message) {
        if(message && message.message) {
            message = message.message
        }
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this)
        } else {
            this.stack = new Error().stack
        }
        this.name = name
        this.message = message || defaultMessage
        this.code = code
    }

    err.prototype = Object.create(HttpError.prototype)
    err.prototype.constructor = HttpError

    lib[name] = err
}

lib.HttpError = HttpError

createErrorType('BadRequest', 400, 'Bad Request')
createErrorType('Unauthorized', 401, 'Unauthorized')
createErrorType('Forbidden', 403, 'Forbidden')
createErrorType('NotFound', 404, 'Not Found')

createErrorType('InternalServer', 500, 'Internal Server Error')
