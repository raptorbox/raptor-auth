const lib = module.exports
const BaseError = require('mongoose/lib/error')

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

    err.prototype = Object.create(BaseError.prototype)
    err.prototype.constructor = BaseError
    err.prototype.toJSON = function() {
        return {
            code: this.code,
            message: this.message
        }
    }

    lib[name] = err
}

lib.BaseError = BaseError

createErrorType('BadRequest', 400, 'Bad Request')
createErrorType('Unauthorized', 401, 'Unauthorized')
createErrorType('Forbidden', 403, 'Forbidden')
createErrorType('NotFound', 404, 'Not Found')

createErrorType('InternalServerError', 500, 'Internal Server Error')
