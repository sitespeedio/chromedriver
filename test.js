const cp = require('node:child_process');
const chromedriver = require('./');
const packageVersion = require('./package.json').version;
const [major, minor] = packageVersion.split('.');
const expectedVersionPrefix = `ChromeDriver ${major}.${minor}`;

const driverVersion = cp
  .execFileSync(chromedriver.binPath(), ['--version'])
  .toString();

if (driverVersion.indexOf(expectedVersionPrefix) !== 0) {
  throw new Error(
    'Expected driver version to be ' +
      expectedVersionPrefix +
      ' but it was ' +
      driverVersion
  );
}
