'use strict';

const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const pkg = require('./package');

module.exports = {
  version: pkg.version,
  binPath: function() {
    let driverPath = path.resolve(__dirname, 'vendor', 'chromedriver');
    if (os.platform() === 'win32') {
      driverPath = driverPath + '.exe';
    } else if (
      (os.platform() === 'linux' && os.arch() === 'arm') ||
      (os.platform() === 'linux' && os.arch() === 'arm64')
    ) {
      // Special handling for making it easy on Raspberry Pis
      try {
        const potentialChromdriverPath = execSync('which chromedriver');
        if (potentialChromdriverPath !== undefined) {
          return potentialChromdriverPath.toString().trim();
        }
      } catch (e) {
        // Just swallow
      }
    } else {
      return driverPath;
    }
  }
};
