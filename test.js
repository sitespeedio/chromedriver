const cp = require('child_process');
const chromedriver = require('./');
const packageVersion = require('./package.json').chromedriver_version;

const expectedVersionPrefix = `ChromeDriver ${packageVersion}`;

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
