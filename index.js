import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { install } from './install.js';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const version = pkg.version;

export function binPath() {
  const driverPath = path.resolve(__dirname, 'vendor', 'chromedriver');
  if (os.platform() === 'win32') {
    return driverPath + '.exe';
  }
  if (
    os.platform() === 'linux' &&
    (os.arch() === 'arm' || os.arch() === 'arm64')
  ) {
    // Special handling for making it easy on Raspberry Pis
    try {
      const potentialChromdriverPath = execSync('which chromedriver');
      if (potentialChromdriverPath !== undefined) {
        return potentialChromdriverPath.toString().trim();
      }
    } catch {
      // Just swallow
    }
    return;
  }
  return driverPath;
}

// Download the driver when it is first necessary, so that npm install has no install script.
export async function ensureBinPath() {
  try {
    await access(binPath());
  } catch {
    await install();
  }
  return binPath();
}

export default { version, binPath, ensureBinPath };
