
const l = module.exports

// 5 min
const intervalSize = 1000 * 60 * 5

let job

l.startCleanJob = () => {
    setInterval(() => {
        const Token = require('../models/token')
        Token.find({
            expires: { $lt: Date.now() }
        })
    }, intervalSize)
}

l.stopCleanJob = () => {
    if(job) {
        clearInterval(job)
        job = null
    }
}
