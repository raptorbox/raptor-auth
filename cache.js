const l = module.exports

const defaultTTL = 10 // in sec
let cache

l.initialize = () => {
    if (cache) return Promise.resolve()

    const cacheManager = require('cache-manager'),
        redisStore = require('cache-manager-redis-store')

    cache = cacheManager.caching({
        store: redisStore,
        host: 'redis',
        db: 0,
        ttl: 600
    })

}

l.close = () => {
    cache.store.getClient().quit()
    cache = null
    return Promise.resolve()
}

l.set = (key, val, ttl) => {
    return new Promise(function(resolve, reject) {
        const json = val.toObject ? val.toObject() : val
        cache.set(key, json, ttl || defaultTTL, function(err) {
            if(err) return reject(err)
            resolve(val)
        })
    })
}

l.get = (key, Model) => {
    return new Promise(function(resolve, reject) {
        cache.get(key, function(err, val) {
            if(err) return reject(err)
            if(Model) {
                val = new Model(val)
                val.isNew = false
            }
            resolve(val)
        })
    })
}

l.del = (key) => {
    return new Promise(function(resolve, reject) {
        cache.del(key, function(err) {
            if(err) return reject(err)
            resolve()
        })
    })
}
