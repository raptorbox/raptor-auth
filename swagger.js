let swaggerSpec
module.exports = () => {

    if (swaggerSpec) {
        return swaggerSpec
    }

    const swaggerJSDoc = require('swagger-jsdoc')
    const config = require('./config')

    // swagger definition
    const swaggerDefinition = {
        info: {
            title: 'Raptor Auth API',
            version: '5.0.0',
            description: 'Raptor Authentication and authorization API',
        },
        host: 'localhost:' + config.port,
        basePath: '/',
    }

    // options for the swagger docs
    var options = {
        swaggerDefinition: swaggerDefinition,
        apis: ['./routes/*.js'],
    }

    // initialize swagger-jsdoc
    swaggerSpec = swaggerJSDoc(options)
    return swaggerSpec
}
