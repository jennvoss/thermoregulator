const lightblue = require('bean-sdk/src/lightblue');
const serialTransport = require('bean-sdk/src/services/serial-transport');
const sdk = lightblue.sdk();

let lastTemp = 0;

function quitGracefully() {
  sdk.quitGracefully(Function.prototype);
}

function tempUpdated(temp) {
  console.log('new temp', temp);
}

sdk.on('discover', (scannedDevice)=> {
  sdk.connectScannedDevice(scannedDevice, (err, bean)=> {
    if (err) {
      console.log(`Bean connection failed: ${err}`)
    } else {
      bean.lookupServices((err)=> {
        // The bean is now ready to be used, you can either call the methods available
        // on the `LightBlueDevice` class, or grab the individual services objects which
        // provide their own API, for example: bean.getDeviceInformationService().

        if (err) {
          console.log(`Service lookup FAILED: ${err}`);
        } else {
          serialTransportService = bean.getSerialTransportService();
          
          // disconnect after 15 seconds
          let disconnectTimeout = setTimeout(function() {
            console.log('quit grace timeout');
            quitGracefully();
          }, 15000);

          serialTransportService.registerForCommandNotification(serialTransport.commandIds.SERIAL_DATA, (serialCmd)=> {
            let newTemp = `${serialCmd.data}`;

            if (!!Number(newTemp) && newTemp !== lastTemp) {
              lastTemp = newTemp;
              tempUpdated(newTemp);
              quitGracefully();
              clearTimeout(disconnectTimeout);
            }
            
          });
        }
      });
    }

  });
});

// scan for devices, timeout after 15 seconds
// filter for only bean devices
sdk.startScanning(15, true);
