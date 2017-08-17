'use strict';

const download = require('download');
const os = require('os');
const pkg = require('./package');

function getChromedriverUrl() {
  let urlBase;
  if (process.env.CHROMEDRIVER_BASE_URL) {
    urlBase = process.env.CHROMEDRIVER_BASE_URL;
  } else {
    urlBase = `https://chromedriver.storage.googleapis.com/${pkg.chromedriver_version}/`;
  }

  switch (os.platform()) {
    case 'darwin':
      return urlBase + 'chromedriver_mac64.zip';
    case 'linux':
      return (
        urlBase +
        (os.arch() === 'x64'
          ? 'chromedriver_linux64.zip'
          : 'chromedriver_linux32.zip')
      );
    case 'win32':
      return urlBase + 'chromedriver_win32.zip';
    default:
      throw new Error('Unsupported platform: ' + os.platform());
  }
}

// eslint-disable-next-line no-console
console.log(`Downloading from ${getChromedriverUrl()}`);
download(getChromedriverUrl(), 'vendor', { mode: '755', extract: true });
