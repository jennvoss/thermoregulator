module.exports = function (data) {
  toggleSwitch(data);
}

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
  const codeSendPulseLength = "189";

  const codes = {
    "1": {
      "on": 349491,
      "off": 349500
    },
    "2": {
      "on": 349635,
      "off": 349644
    },
    "3": {
      "on": 349955,
      "off": 349964
    },
    "4": {
      "on": 351491,
      "off": 351500
    },
    "5": {
      "on": 357635,
      "off": 357644
    },
  };

  const codeToToggle = codes[data.outletId][data.outletStatus];

  run_cmd('sudo ' + codeSendPath + ' ' + codeToToggle + ' -p ' + codeSendPIN + ' -l ' + codeSendPulseLength);
}
