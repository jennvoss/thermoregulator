'use strict';

const toggle = require('./toggle.js');
const bean = require('./bean.js');
const tempEmitter = bean.temperature();

const fb_admin = require('firebase-admin');
const fb_db = require('firebase/database'); // only needed for ServerValue.TIMESTAMP
const fb_serviceAccount = require('./secret/thermoregulator-67d13-firebase-adminsdk-kwc9p-897e8a0389.json');
const fb_db_url = "https://thermoregulator-67d13.firebaseio.com";


// high and low temp defaults (celcius)
let lowTemp = 29; // 84.2 F
let highTemp = 32; // 89.6 F
let lastTemp = null;


// firebase
fb_admin.initializeApp({
  credential: fb_admin.credential.cert(fb_serviceAccount),
  databaseURL: fb_db_url
});

const db = fb_admin.database();
const threshold = db.ref('/threshold');
const tempList = db.ref('/tempReadings');
const lastReading = db.ref('/lastReading');

threshold.on('value', function(snapshot) {
  lowTemp = snapshot.low;
  highTemp = snapshot.high;
}, function (errorObject) {
  console.log('The read failed: ' + errorObject.code);
});


// temp reader
tempEmitter.startPolling({ interval: 300 });
tempEmitter.on('temperature', (temp)=> {
  let t = {
    temperature: temp,
    timestamp: fb_db.ServerValue.TIMESTAMP
  };

  lastReading.set(t);

  if (temp !== lastTemp) {
    let newTempRef = tempList.push();
    newTempRef.set(t);
    lastTemp = temp;
  }

  // toggleLight(temp);
});

tempEmitter.on('error', (err)=> {
  console.log('error: ', err);
  tempEmitter.quitGracefully();
});

function toggleLight(temp) {
  if (temp > highTemp) {
    // turn the lamp off
  } else if (temp < lowTemp) {
    // turn the lamp on
  }
}

