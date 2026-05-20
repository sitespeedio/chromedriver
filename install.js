import os from 'node:os';
import path from 'node:path';
import { mkdir, unlink, chmod } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
  return;
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

// System tar (bsdtar on macOS/Windows 10+, GNU tar on Linux) can extract zips.
// --strip-components=1 drops the `chromedriver-<platform>/` prefix so the
// binary lands directly at vendor/chromedriver[.exe].
async function extractDriver(zipPath, dir, vendorDir) {
  const isWindows = os.platform() === 'win32';
  const entry = isWindows
    ? `chromedriver-${dir}/chromedriver.exe`
    : `chromedriver-${dir}/chromedriver`;
  await execFileAsync('tar', [
    '-xf',
    zipPath,
    '-C',
    vendorDir,
    '--strip-components=1',
    entry
  ]);
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
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  console.log(`Downloading Chromedriver ${CHROMEDRIVER_VERSION} from ${url}`);
  await downloadFile(url, zipPath);
  await extractDriver(zipPath, dir, vendorDir);
  await unlink(zipPath);
  await chmod(binPath, 0o755);
  console.log(`Chromedriver ${CHROMEDRIVER_VERSION} installed in ${vendorDir}`);
}

try {
  await install();
} catch (error) {
  console.error(
    `Chromedriver ${CHROMEDRIVER_VERSION} could not be installed: ${error.message}`
  );
  process.exitCode = 1;
}
