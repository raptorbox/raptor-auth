

const random = (len) => {
    len = len || 36
    let s = ''
    while(s.length < len) {
        s += ((Math.random() * Date.now()).toString(36).substr(2))
            .replace(/[^a-z]*/g, '')
    }
    return s.substr(0, len)
}

module.exports = function (schema, options) {
    options = options || {}
    schema.statics.random = random
}

module.exports.random = random
