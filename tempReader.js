'use strict';

const toggleSwitch = require('./toggle.js');
const tempEmitter = require('./bean.js').temperature();
const fb_db = require('firebase/database'); // only needed for ServerValue.TIMESTAMP
const fb_admin = require('firebase-admin');
const fb_serviceAccount = require('./secret/thermoregulator-67d13-firebase-adminsdk-kwc9p-897e8a0389.json');
const fb_db_url = "https://thermoregulator-67d13.firebaseio.com";

class TempReader {
  constructor() {
    // high and low temp defaults (celcius)
    this.lowTemp = 29; // 84.2 F
    this.highTemp = 32; // 89.6 F

    this.lastTemp = null;
    this.lightOn = false;
    this.db_refs = {};
  }

  getServerTimestamp() {
    return fb_db.ServerValue.TIMESTAMP;
  }

  init() {
    this.initFireBase();

    tempEmitter.startPolling({ interval: 300 });

    tempEmitter.on('temperature', (temp)=> {
      this.logTemp(temp);
    });

    tempEmitter.on('error', (err)=> {
      console.log('error: ', err);
      tempEmitter.quitGracefully();
    });
  }

  initFireBase() {
    fb_admin.initializeApp({
      credential: fb_admin.credential.cert(fb_serviceAccount),
      databaseURL: fb_db_url
    });

    let db = fb_admin.database();
    this.db_refs.tempList = db.ref('/tempReadings');
    this.db_refs.lastReading = db.ref('/lastReading');
    this.db_refs.lightOn = db.ref('/lightOn');

    const threshold = db.ref('/threshold');
    threshold.on('value', function(snapshot) {
      this.lowTemp = snapshot.low;
      this.highTemp = snapshot.high;
    }.bind(this), function (errorObject) {
      console.log('The read failed: ' + errorObject.code);
    });
  }

  logTemp(temp) {
    let t = {
      temperature: temp,
      timestamp: this.getServerTimestamp()
    };

    this.db_refs.lastReading.set(t);

    if (temp !== this.lastTemp) {
      let newTempRef = this.db_refs.tempList.push();
      newTempRef.set(t);
      this.lastTemp = temp;
      this.toggleLight();
    }
  }

  toggleLight() {
    if (this.lastTemp < this.lowTemp && !this.lightOn) {
      toggleSwitch({
        outletId: '1',
        outletStatus: 'on'
      });
      this.lightOn = true;
      this.db_refs.lightOn.set(true);
    }

    if (this.lastTemp >= this.lowTemp && this.lightOn) {
      toggleSwitch({
        outletId: '1',
        outletStatus: 'off'
      });
      this.lightOn = false;
      this.db_refs.lightOn.set(false);
    }
  }
}

module.exports = TempReader;
