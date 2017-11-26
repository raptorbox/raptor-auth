
module.exports = function (schema, options) {
    options = options || {}
    schema.statics.findPaged = function(query, paging) {

        const M = this

        query = query || {}
        paging = paging || {}

        // validate input
        if (paging.limit && (paging.limit*1 != paging.limit)) {
            paging.size = 25
        }
        if(paging.limit > 1000) {
            paging.limit = 1000
        }
        if (paging.page && (paging.page*1 != paging.page)) {
            paging.page = 0
        }
        if (paging.sort && (typeof paging.sort !== 'string' || paging.sort.length > 18)) {
            paging.sort = null
        }

        let page = 0
        if(paging.page) {
            page = Math.max(0, paging.page - 1)
        }

        let limit = 50
        if(paging.limit) {
            limit = Math.max(0, paging.limit * 1)
        }

        let sort = {}
        let sortInfo = {}
        if(paging.sort && typeof paging.sort === 'string') {

            const p = paging.sort.split(',')
            const isAsc = p[1] && p[1].toLowerCase() === 'asc'
            sortInfo.property = p[0]
            sortInfo.direction =  isAsc ? 'asc' : 'desc'
            sortInfo.ascending = isAsc
            sortInfo.descending = !isAsc

            sort[sortInfo.property] = isAsc ? 1 : -1
        }

        return M.find(query).count()
            .then((len) => {
                const totalPages = Math.floor(len / limit)
                return M.find(query)
                    .sort(sort)
                    .skip(page * limit)
                    .limit(limit)
                    .exec()
                    .then((records) => {
                        return Promise.resolve({
                            first: page === 0,
                            last: page === totalPages,
                            number: page,
                            totalPages: totalPages,
                            totalElements: len,
                            numberOfElements: records.length,
                            sort: [sortInfo],
                            total: len,
                            size: limit,
                            page: page,
                            content: records.map((r) => new M(r))
                        })
                    })
            })
    }

}
