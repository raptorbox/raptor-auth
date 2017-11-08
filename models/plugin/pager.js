
module.exports = function (schema, options) {
    options = options || {}
    schema.statics.findPaged = function(query, paging) {

        const M = this

        query = query || {}
        paging = paging || {}

        // validate input
        if (paging.size && (paging.size*1 != paging.size)) {
            paging.size = null
        }
        if(paging.size > 1000) {
            paging.size = 1000
        }
        if (paging.page && (paging.page*1 != paging.page)) {
            paging.page = null
        }
        if (paging.sort && (typeof paging.sort !== 'string' || paging.sort.length > 18)) {
            paging.sort = null
        }

        let page = 0
        if(paging.page) {
            page = Math.max(0, paging.page - 1)
        }

        let size = 50
        if(paging.size) {
            size = Math.max(0, paging.size * 1)
        }

        let sort = paging.sort || {}
        if(typeof sort === 'string') {
            let s = {}
            s[sort] = 1
            sort = s
        }

        return M.find(query).count()
            .then((len) => {
                return M.find(query)
                    .sort(sort)
                    .skip(page * size)
                    .limit(size)
                    .exec()
                    .then((records) => {
                        return Promise.resolve({
                            total: len,
                            page: page,
                            size: size,
                            sort: sort,
                            content: records.map((r) => new M(r))
                        })
                    })
            })
    }

}
