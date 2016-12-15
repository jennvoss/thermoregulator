'use strict';

const Hapi = require('hapi');
const server = new Hapi.Server();

const toggle = require('./toggle.js');
const bean = require('./bean.js');
const tempEmitter = bean.temperature();

const admin = require('firebase-admin');
const fb_serviceAccount = require('./secret/thermoregulator-67d13-firebase-adminsdk-kwc9p-897e8a0389.json');
const fb_db_url = "https://thermoregulator-67d13.firebaseio.com";

// high and low temp defaults (celcius)
let lowTemp = 29; // 84.2 F
let highTemp = 32; // 89.6 F

// web server
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

// temp reader
tempEmitter.startPolling({ interval: 30 });
tempEmitter.on('temperature', (temp)=> {
  console.log('here is the temp: ', temp);
});

tempEmitter.on('error', (err)=> {
  console.log('error: ', err);
  tempEmitter.quitGracefully();
});

// firebase
admin.initializeApp({
  credential: admin.credential.cert(fb_serviceAccount),
  databaseURL: fb_db_url
});

const db = admin.database();
const threshold = db.ref('/threshold');

threshold.on('value', function(snapshot) {
  lowTemp = snapshot.low;
  highTemp = snapshot.high;
}, function (errorObject) {
  console.log('The read failed: ' + errorObject.code);
});