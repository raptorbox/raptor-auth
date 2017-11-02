
// module property map to base path eg. /auth/user
module.exports[''] = require('./auth.js')
module.exports.user = require('./user.js')
module.exports.role = require('./role.js')
module.exports.token = require('./token.js')
