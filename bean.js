'use strict';

const events = require('events');
const lightblue = require('bean-sdk/src/lightblue');
const serialTransport = require('bean-sdk/src/services/serial-transport');
const sdk = lightblue.sdk();

class TempEmitter extends events.EventEmitter {
  /**
   * This class implements the EventEmitter which allows clients to register
   * for events using the .on() method. Events include:
   *
   *    - "temperature"
   *
   */
  constructor() {
    super();
    this._temperature = null;
    this._device = null;
    this._pollingOptions = { timeout: 15, interval: 300 };

    sdk.on('discover', (scannedDevice)=> {
      this._device = scannedDevice;
      this._connectToDevice(this._device);

      this.stopPolling();
      this._poller = setInterval(this._connectToDevice.bind(this, this._device), this._pollingOptions.interval*1000);
    });
  }

  _connectToDevice(scannedDevice) {
    sdk.connectScannedDevice(scannedDevice, (err, bean)=> {
      if (err) {
        this.emit('error', `Bean connection failed: ${err}`);
      } else {
        bean.lookupServices((err)=> {
          // The bean is now ready to be used, you can either call the methods available
          // on the `LightBlueDevice` class, or grab the individual services objects which
          // provide their own API, for example: bean.getDeviceInformationService().

          if (err) {
            this.emit('error', `Service lookup FAILED: ${err}`);
          } else {
            this._getTransportService(bean);
          }
        });
      }
    });
  }

  _getTransportService(bean) {
    const serialTransportService = bean.getSerialTransportService();
    serialTransportService.registerForCommandNotification(serialTransport.commandIds.SERIAL_DATA, this._readSerialData.bind(this));

    // disconnect after 5 seconds, in case the serial data is borked
    this.disconnectTimeout = setTimeout(this.quitGracefully, 5000);
  }

  _readSerialData(serialCmd) {
    this._temperature = `${serialCmd.data}`;

    if (!!Number(this._temperature)) {
      this.emit('temperature', this._temperature);
      this.quitGracefully();
      clearTimeout(this.disconnectTimeout);
    }
  }

  quitGracefully() {
    sdk.quitGracefully(Function.prototype);
  }

  startPolling(opts) {
    this._pollingOptions = Object.assign({}, this._pollingOptions, opts);
    sdk.startScanning(this._pollingOptions.timeout, true);
  }

  stopPolling() {
    clearInterval(this._poller);
  }
}

let tempEmitter = null;
function getTempEmitter() {
  if (!tempEmitter) {
    tempEmitter = new TempEmitter();
  }
  return tempEmitter;
}

module.exports = {
  temperature: getTempEmitter
}
