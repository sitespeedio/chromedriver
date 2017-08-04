'use strict';

let request = require('request'),
  semver = require('semver'),
  packageVersion = require('./package.json').version;

request("https://chromedriver.storage.googleapis.com/LATEST_RELEASE",
  function(error, response, body) {
    if (error) {
      console.log("Failed to parse latest release version: " + error.message);
      return process.exit(1);
    }

    let latestSemver = body.trim() + '.0'; // Hack for the fact that chromedriver version lacks patch version
    if (semver.gt(latestSemver, packageVersion, true)) {
      console.log('Upgrade to ' + body);
      process.exit(1);
    }
    console.log('Relax, ' + packageVersion + ' is the latest version');
  });
