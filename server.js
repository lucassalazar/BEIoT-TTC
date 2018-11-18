const mongoose = require('mongoose')
const mqtt = require('mqtt')
const fs = require('fs')

var CA = fs.readFileSync('./ca.crt')

const HOST = 'localhost'
const PORT = 8883

const options = {
  host: HOST,
  port: PORT,
  //key: KEY,
  //cert: CERT,
  rejectUnauthorized: true,
  ca: CA,
  clientId: 'mqttjs_backend',
  protocol: 'mqtts',
  qos: 1,
  username: '{USERNAME}',
  password: '{PASSWORD}'
}

// Load Location Model
require('./models/Location')
const Location = mongoose.model('locations')

//Load Token Model
require('./models/Token')
const Token = mongoose.model('tokens')

// Connect to mongoose
mongoose.connect('mongodb://{MONGO_PATH}', {
  useNewUrlParser: true
})
  .then(() => console.log('MongoDB Connected!'))
  .catch(err => console.log(err))

var start = () => {

  const client = mqtt.connect(options)

  client.on('connect', () => {
    console.log(`Client ${options.clientId} connected.`)
  })

  client.subscribe('/bengala/location/#', () => {
    console.log('Client subscribed.')
  })

  client.on('message', (topic, message, packet) => {
    console.log('Tópico: ' + topic + '\nMensagem: ' + message)

    let tkn = topic.split('/')[3]

    let msg = message.toString().replace(/\s/g, '').split(',')

    let lat = msg[0]
    let long = msg[1]

    console.log(tkn)
    console.log(lat)
    console.log(long)

    Token.findOne({ token: tkn })
      .then(token => {
        if (token) {
          const newLocation = new Location({
            token: tkn,
            lat: lat,
            long: long
          })
          newLocation.save()
            .then(location => {
              console.log('Location added.')
            })
            .catch(err => {
              console.log(err)
              return
            })
        } else {
          console.log('Invalid message, mac address is not authorized.')
          return
        }
      })
  })
}

module.exports = {
  start
}
