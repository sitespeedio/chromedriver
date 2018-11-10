'use strict';

var os = require('os'),
  path = require('path'),
  pkg = require('./package');

module.exports.chromedriver = {
  version: pkg.version,
  binPath: function() {
    var driverPath = path.resolve(__dirname, 'vendor', 'chromedriver');
    if (os.platform() === 'win32') {
      driverPath = driverPath + '.exe';
    }
    return driverPath;
  }
};
