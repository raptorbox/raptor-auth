
const l = module.exports
const mqtt = require('mqtt')
const config = require('./config')
const logger = require('./logger')

let client

l.connect = () => {

    client = mqtt.connect(config.broker, {
        username: config.users.service.username,
        password: config.users.service.password,
    })
    client.on('close', function() {
        // logger.debug('MQTT disconnected')
    })
    client.on('connect', function() {
        logger.debug('MQTT connected')
    })
    client.on('reconnect', function() {
        // logger.debug('MQTT reconnecting')
    })
}

l.publish = (topic, msg) => {
    client && client.publish(topic, msg)
}

l.send = (msg) => {
    let json = msg
    if(msg.toJSON) {
        json = msg.toJSON()
    }
    if(typeof json === 'object') {
        json = JSON.stringify(json)
    }
    client && l.publish(`${msg.type}/${msg.id}`, json)
}

l.close = () => {
    client && client.end()
}
