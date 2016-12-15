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
    let _ctx = this;
    sdk.connectScannedDevice(scannedDevice, (err, bean)=> {
      if (err) {
        _ctx.emit('error', `Bean connection failed: ${err}`);
      } else {
        bean.lookupServices((err)=> {
          // The bean is now ready to be used, you can either call the methods available
          // on the `LightBlueDevice` class, or grab the individual services objects which
          // provide their own API, for example: bean.getDeviceInformationService().

          if (err) {
            _ctx.emit('error', `Service lookup FAILED: ${err}`);
          } else {
            const serialTransportService = bean.getSerialTransportService();
            
            // disconnect after 5 seconds
            _ctx.disconnectTimeout = setTimeout(_ctx.quitGracefully, 5000);

            serialTransportService.registerForCommandNotification(serialTransport.commandIds.SERIAL_DATA, (serialCmd)=> {
              _ctx._temperature = `${serialCmd.data}`;

              if (!!Number(_ctx._temperature)) {
                _ctx.emit('temperature', _ctx._temperature);
                _ctx.quitGracefully();
                clearTimeout(_ctx.disconnectTimeout);
              }            
            });
          }
        });
      }
    });
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
