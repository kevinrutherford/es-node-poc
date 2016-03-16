var Hapi = require('hapi')
var subscriber = require('./event-store-subscriber')

if (!process.env.PORT)
  throw "PORT env var not set!"

var server = new Hapi.Server()
server.connection({
  host: '0.0.0.0',
  port: process.env.PORT
})

server.endpoint = (opts) => server.route({
  method: 'GET',
  path: opts.path,
  handler: (request, reply) => reply(JSON.stringify(opts.handler(), null, 2))
})

server.route({
  method: 'GET',
  path: '/info',
  handler: (request, reply) => reply(JSON.stringify(subscription.info(), null, 2))
})

var handleAnything
server.onAnyEvent = (handler) => handleAnything = handler

var handlers
server.handleEvents = (eventHandlers) => handlers = eventHandlers

var subscription = subscriber(function(evt) {
  if (handleAnything)
    handleAnything(evt)
  if (handlers[evt.eventType]) {
    var eventData = JSON.parse(evt.data)
    eventData.streamId = evt.streamId
    handlers[evt.eventType](eventData)
  }
})

server.subscribeToEvents = function() {
  server.start(function (err) {
    if (err)
      throw err
    console.log('Server running at:', server.info.uri)
    subscription.start()
  })
}

module.exports = server
