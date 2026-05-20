import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const LATEST_URL =
  'https://googlechromelabs.github.io/chrome-for-testing/last-known-good-versions.json';

function compareVersions(a, b) {
  const aParts = a.split('.').map(Number);
  const bParts = b.split('.').map(Number);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const diff = (aParts[i] || 0) - (bParts[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

try {
  const response = await fetch(LATEST_URL);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  const data = await response.json();
  const latestVersion = data?.channels?.Stable?.version;
  if (!latestVersion) {
    throw new Error('Could not find Stable channel version in response');
  }
  const currentVersion = pkg.chromedriver_version;
  if (compareVersions(latestVersion, currentVersion) > 0) {
    console.log(`Upgrade to ${latestVersion}`);
    process.exitCode = 1;
  } else {
    console.log(`Relax, ${currentVersion} is the latest version`);
  }
} catch (error) {
  console.log(`Failed to parse latest release version: ${error.message}`);
  process.exitCode = 1;
}
