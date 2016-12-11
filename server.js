'use strict';

const Hapi = require('hapi');
const server = new Hapi.Server();
const toggle = require('./toggle.js');

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
