const l = module.exports

const defaultTTL = 10 // in sec
let cache

l.initialize = () => {
    const mongoose = require('mongoose'),
        cacheManager = require('cache-manager'),
        mongooseStore = require('cache-manager-mongoose')

    cache = cacheManager.caching({
        store : mongooseStore,
        mongoose: mongoose,
        modelOptions: {
            collection: 'caches',
            versionKey: false // do not create __v field
        },
        ttl: defaultTTL
    })
}


l.set = (key, val, ttl) => {
    return new Promise(function(resolve, reject) {
        cache.set(key, val, ttl || defaultTTL, function(err) {
            if(err) return reject(err)
            resolve(val)
        })
    })
}

l.get = (key) => {
    return new Promise(function(resolve, reject) {
        cache.get(key, function(err, val) {
            if(err) return reject(err)
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
