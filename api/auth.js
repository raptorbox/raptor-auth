
const Promise = require('bluebird')
const l = module.exports

// 5 min
const intervalSize = 1000 * 60 * 5

let job

l.startCleanJob = () => {
    setInterval(() => {
        const api = require('./index')
        api.models.Token.find({
            expires: { $lt: Date.now() }
        }).then((tokens) => {
            return Promise.all(tokens)
                .each((token) => {
                    if(token.expires === null || token.expires === 0) {
                        return Promise.resolve()
                    }
                    return api.Token.delete({ id : token.id })
                })
        })
    }, intervalSize)
}

l.stopCleanJob = () => {
    if(job) {
        clearInterval(job)
        job = null
    }
}
