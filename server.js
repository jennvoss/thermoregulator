'use strict';

const Hapi = require('hapi');
const server = new Hapi.Server();
const toggle = require('./toggle.js');
const bean = require('./bean.js');
const tempEmitter = bean.temperature();

server.connection({ port: 3000 });

server.register(require('inert'), (err) => {
  if (err) {
    throw err;
  }

  server.route({
    method: 'GET',
    path: '/{filename}',
    handler: {
      file: function (request) {
        return request.params.filename;
      }
    }
  });

  server.route({
    method: 'GET',
    path: '/',
    handler: function (request, reply) {
      reply.file('./index.html');
    }
  });

  server.route({
    method: 'POST',
    path: '/toggle',
    handler: function (request, reply) {
      const body = request.payload;
      toggle(body);
    }
  });

  server.start((err) => {
    if (err) {
      throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
  });

});

tempEmitter.startPolling();
tempEmitter.on('temperature', (temp)=> {
  console.log('here is the temp: ', temp);
});

tempEmitter.on('error', (err)=> {
  console.log('error: ', err);
  tempEmitter.quitGracefully();
});