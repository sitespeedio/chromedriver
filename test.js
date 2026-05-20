import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { binPath } from './index.js';

const require = createRequire(import.meta.url);
const packageVersion = require('./package.json').version;
const [major, minor] = packageVersion.split('.');
const expectedVersionPrefix = `ChromeDriver ${major}.${minor}`;

const driverVersion = execFileSync(binPath(), ['--version']).toString();

if (!driverVersion.startsWith(expectedVersionPrefix)) {
  throw new Error(
    `Expected driver version to be ${expectedVersionPrefix} but it was ${driverVersion}`
  );
}
