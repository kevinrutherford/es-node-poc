var Hapi = require('hapi');
var subscriber = require('./event-store-subscriber');

if(!process.env.PORT)
  throw "PORT env var not set!"

// if(!process.env.JWT_PRIVATE_KEY)
//   throw "JWT_PRIVATE_KEY env var not set!"

var server = new Hapi.Server();
server.connection({
  host: '0.0.0.0',
  port: process.env.PORT
});

var validateCredentials = function(req, decoded, cb) {
  return cb(null, true, decoded);
}

// server.register(require('hapi-auth-jwt'), function(err) {
//   var key = new Buffer(process.env.JWT_PRIVATE_KEY, 'base64').toString();
//   server.auth.strategy('token', 'jwt', {
//     key: key,
//     validateFunc: validateCredentials
//   });
// });

server.get = function(opts) {
  server.route({
    method: 'GET',
    path: opts.path,
    handler: function (request, reply) {
      // if(request.auth.credentials.PlatformAdmin !== "True")
      //   return reply({credentials: request.auth.credentials}).code(403);
      reply(opts.handler());
    // },
    // config: {
    //   auth: 'token'
    }
  });
}

server.route({
  method: 'GET',
  path:'/info',
  handler: function (request, reply) {
    // if(request.auth.credentials.PlatformAdmin !== "True")
    //   return reply({credentials: request.auth.credentials}).code(403);
    reply(subscription.info());
  // },
  // config: {
  //   auth: 'token'
  }
});

var handleAnything;
server.onAnyEvent = function(handler) {
  handleAnything = handler;
}

var handlers;
server.handleEvents = function(eventHandlers) {
  handlers = eventHandlers;
}

var subscription = subscriber(function(evt) {
  if(handleAnything)
    handleAnything(evt);

  if(handlers[evt.eventType]) {
    var eventData = JSON.parse(evt.data);
    eventData.streamId = evt.streamId;
    handlers[evt.eventType](eventData);
  }
});

server.subscribeToEvents = function() {
  server.start(function (err) {
    if(err)
      throw err;
    console.log('Server running at:', server.info.uri);
    subscription.start();
  });
}

module.exports = server;
