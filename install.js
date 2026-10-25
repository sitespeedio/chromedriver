import os from 'node:os';
import path from 'node:path';
import { mkdir, unlink, chmod, writeFile } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import StreamZip from 'node-stream-zip';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The version of the driver that will be installed
const CHROMEDRIVER_VERSION =
  process.env.CHROMEDRIVER_VERSION || pkg.chromedriver_version;

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
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status} ${response.statusText} for ${url}`
    );
  }
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
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

export async function install() {
  if (process.env.CHROMEDRIVER_SKIP_DOWNLOAD) {
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
  await extractDriver(zipPath, dir, binPath);
  await unlink(zipPath);
  await chmod(binPath, 0o755);
  console.log(`Chromedriver ${CHROMEDRIVER_VERSION} installed in ${vendorDir}`);
}

// Install only when this file runs as a script, not when index.js imports it.
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await install();
  } catch (error) {
    console.error(
      `Chromedriver ${CHROMEDRIVER_VERSION} could not be installed: ${error.message}`
    );
    process.exitCode = 1;
  }
}
