/* eslint-disable no-console */
'use strict';

const request = require('request');
const currentVersion = require('./package.json').chromedriver_version;

request(
  'https://chromedriver.storage.googleapis.com/LATEST_RELEASE',
  (error, response, body) => {
    if (error) {
      console.log(`Failed to parse latest release version: ${error.message}`);
      return process.exit(1);
    }

    const latestVersion = Number(body.trim());
    if (latestVersion > Number(currentVersion)) {
      console.log(`Upgrade to ${latestVersion}`);
      process.exit(1);
    }
    console.log(`Relax, ${currentVersion} is the latest version`);
  }
);
