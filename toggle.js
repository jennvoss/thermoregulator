function run_cmd(cmd, callBack) {
  const util = require('util');
  const exec = require('child_process').exec;
  function log(error, stdout, stderr) { console.log(error, stdout, stderr); }
  exec(cmd, log);
}

function toggleSwitch(data) {
  const codeSendPath = './codesend';

  // This PIN is not the first PIN on the Raspberry Pi GPIO header!
  // Consult https://projects.drogon.net/raspberry-pi/wiringpi/pins/
  // for more information.
  const codeSendPIN = "0";

  // Pulse length depends on the RF outlets you are using. Use RFSniffer to see what pulse length your device uses.
  const codeSendPulseLength = "184";

  const codes = {
    "1": {
      "on": 1070387,
      "off": 1070396
    },
    "2": {
      "on": 1070531,
      "off": 1070396
    },
    "3": {
      "on": 1070851,
      "off": 1070860
    }
  };

  const codeToToggle = codes[data.outletId][data.outletStatus];

  let cmd = 'sudo ' + codeSendPath + ' ' + codeToToggle + ' -p ' + codeSendPIN + ' -l ' + codeSendPulseLength;
  run_cmd(cmd);
}

module.exports = function(data) {
  toggleSwitch(data);
}
