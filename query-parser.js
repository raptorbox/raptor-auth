
const parse = ({params = {}, pagerFields = ['size','page','sort'], queryFields = []}) => {

    let getFields = (fields) => {
        return fields.reduce((obj, field) => {
            if (params[field] !== undefined) {
                obj[field] = params[field]
            }
            return obj
        }, {})
    }

    // set pager fields
    const pager = getFields(pagerFields)

    // set model fields
    const query = getFields(queryFields)

    return { query, pager }
}

module.exports = { parse }
