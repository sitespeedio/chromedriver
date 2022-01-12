'use strict';

const StreamZip = require('node-stream-zip');
const os = require('os');
const fs = require('fs');
const path = require('path');
const pkg = require('./package');
const { DownloaderHelper } = require('node-downloader-helper');
const { promisify } = require('util');
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);
const chmod = promisify(fs.chmod);

// The version of the driver that will be installed
const CHROMEDRIVER_VERSION = process.env.CHROMEDRIVER_VERSION
  ? process.env.CHROMEDRIVER_VERSION
  : `${pkg.chromedriver_version}`;

function byteHelper(value) {
  // https://gist.github.com/thomseddon/3511330
  const units = ['b', 'kB', 'MB', 'GB', 'TB'],
    number = Math.floor(Math.log(value) / Math.log(1024));
  return (
    (value / Math.pow(1024, Math.floor(number))).toFixed(1) +
    ' ' +
    units[number]
  );
}

function getChromedriverUrl() {
  let urlBase;
  if (process.env.CHROMEDRIVER_BASE_URL) {
    urlBase = process.env.CHROMEDRIVER_BASE_URL;
  } else {
    urlBase = `https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/`;
  }

  switch (os.platform()) {
    case 'darwin':
      if (os.arch() === 'x64') return urlBase + 'chromedriver_mac64.zip';
      else return urlBase + 'chromedriver_mac64_m1.zip';
    case 'linux':
      if (os.arch() === 'x64') return urlBase + 'chromedriver_linux64.zip';
      else if (os.arch() === 'x32') return urlBase + 'chromedriver_linux32.zip';
      else return undefined;
    case 'win32':
      return urlBase + 'chromedriver_win32.zip';
    default:
      return undefined;
  }
}

async function download() {
  if (
    process.env.npm_config_chromedriver_skip_download ||
    process.env.CHROMEDRIVER_SKIP_DOWNLOAD
  ) {
    console.log('Skip downloading Chromedriver');
  } else {
    const downloadUrl = getChromedriverUrl();
    if (downloadUrl) {
      try {
        await mkdir('vendor');
      } catch (e) {
        try {
          await unlink('vendor/chromedriver');
        } catch (e) {
          // DO nada
        }
      }
      const dl = new DownloaderHelper(downloadUrl, 'vendor', {
        fileName: 'chromedriver.zip'
      });

      dl.on('error', err =>
        console.error('Could not download Chromedriver: ' + downloadUrl, err)
      )
        .on('progress', stats => {
          const progress = stats.progress.toFixed(1);
          const downloaded = byteHelper(stats.downloaded);
          const total = byteHelper(stats.total);
          console.log(`${progress}% [${downloaded}/${total}]`);
        })
        .on('end', () => {
          const zip = new StreamZip({
            file: 'vendor/chromedriver.zip',
            storeEntries: true
          });
          zip.on('error', function(err) {
            // We got an error from unpacking
            console.error(
              `Chromedriver ${CHROMEDRIVER_VERSION} could not be installed: ${err} `
            );
            // How should we exit?
          });
          zip.on('ready', () => {
            zip.extract(null, './vendor', async err => {
              console.log(
                err
                  ? 'Could not extract and install Chromedriver'
                  : `Chromedriver ${CHROMEDRIVER_VERSION} installed in ${path.join(
                      __dirname,
                      'vendor'
                    )}`
              );
              zip.close();
              await unlink('vendor/chromedriver.zip');
              let driverPath = 'vendor/chromedriver';
              if (os.platform() === 'win32') {
                driverPath = driverPath + '.exe';
              }
              await chmod(driverPath, '755');
            });
          });
        });

      dl.start();
    } else {
      console.log(
        'Skipping installing Chromedriver on ' +
          os.platform() +
          ' for ' +
          os.arch() +
          " since there's no official build"
      );
      if (os.platform() === 'linux' && os.arch() === 'arm') {
        console.log(
          'You can try downloading Chromedriver using: sudo apt-get install chromium-chromedriver -y'
        );
      }
    }
  }
}
download();
