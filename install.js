'use strict';

const os = require('node:os');
const path = require('node:path');
const { mkdir, unlink, chmod } = require('node:fs/promises');
const { createWriteStream } = require('node:fs');
const { pipeline } = require('node:stream/promises');
const { Readable } = require('node:stream');
const StreamZip = require('node-stream-zip');
const pkg = require('./package.json');

// The version of the driver that will be installed
const CHROMEDRIVER_VERSION =
  process.env.CHROMEDRIVER_VERSION || pkg.chromedriver_version;

function byteHelper(value) {
  // https://gist.github.com/thomseddon/3511330
  if (!value) return '?';
  const units = ['B', 'kB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(value) / Math.log(1024));
  return `${(value / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getPlatformDir() {
  const platform = os.platform();
  const arch = os.arch();
  if (platform === 'darwin') {
    return arch === 'x64' ? 'mac-x64' : 'mac-arm64';
  }
  if (platform === 'linux') {
    return arch === 'x64' ? 'linux64' : undefined;
  }
  if (platform === 'win32') {
    return 'win32';
  }
  return undefined;
}

function getChromedriverUrl(dir) {
  const base =
    process.env.CHROMEDRIVER_BASE_URL ||
    `https://storage.googleapis.com/chrome-for-testing-public/${CHROMEDRIVER_VERSION}/`;
  return `${base}${dir}/chromedriver-${dir}.zip`;
}

async function downloadFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} for ${url}`
    );
  }
  const total = Number(response.headers.get('content-length')) || 0;
  let downloaded = 0;
  let lastLog = 0;
  const body = Readable.fromWeb(response.body);
  body.on('data', chunk => {
    downloaded += chunk.length;
    const now = Date.now();
    if (now - lastLog >= 250) {
      const pct = total ? ((downloaded / total) * 100).toFixed(1) : '?';
      console.log(`${pct}% [${byteHelper(downloaded)}/${byteHelper(total)}]`);
      lastLog = now;
    }
  });
  await pipeline(body, createWriteStream(destination));
}

async function extractDriver(zipPath, dir, destPath) {
  const isWindows = os.platform() === 'win32';
  const entry = isWindows
    ? `chromedriver-${dir}/chromedriver.exe`
    : `chromedriver-${dir}/chromedriver`;
  const zip = new StreamZip.async({ file: zipPath });
  try {
    await zip.extract(entry, destPath);
  } finally {
    await zip.close();
  }
}

async function install() {
  if (
    process.env.npm_config_chromedriver_skip_download ||
    process.env.CHROMEDRIVER_SKIP_DOWNLOAD
  ) {
    console.log('Skip downloading Chromedriver');
    return;
  }

  const dir = getPlatformDir();
  if (!dir) {
    console.log(
      `Skipping installing Chromedriver on ${os.platform()} for ${os.arch()} since there's no official build`
    );
    if (os.platform() === 'linux' && os.arch() === 'arm') {
      console.log(
        'You can try downloading Chromedriver using: sudo apt-get install chromium-chromedriver -y'
      );
    }
    return;
  }

  const url = getChromedriverUrl(dir);
  const vendorDir = path.resolve(__dirname, 'vendor');
  await mkdir(vendorDir, { recursive: true });

  const zipPath = path.join(vendorDir, 'chromedriver.zip');
  const ext = os.platform() === 'win32' ? '.exe' : '';
  const binPath = path.join(vendorDir, `chromedriver${ext}`);

  try {
    await unlink(binPath);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  console.log(`Downloading Chromedriver ${CHROMEDRIVER_VERSION} from ${url}`);
  await downloadFile(url, zipPath);
  await extractDriver(zipPath, dir, binPath);
  await unlink(zipPath);
  await chmod(binPath, 0o755);
  console.log(`Chromedriver ${CHROMEDRIVER_VERSION} installed in ${vendorDir}`);
}

install().catch(err => {
  console.error(
    `Chromedriver ${CHROMEDRIVER_VERSION} could not be installed: ${
      err.message
    }`
  );
  process.exit(1);
});
