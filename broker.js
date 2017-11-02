
const l = module.exports
const mqtt = require('mqtt')
const config = require('./config')
const logger = require('./logger')

let client

l.connect = () => {
    client = mqtt.connect(config.broker)
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
    client && client.publish(`${msg.type}/${msg.id}`, msg)
}

l.close = () => {
    client && client.end()
}
