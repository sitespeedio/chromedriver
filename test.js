const cp = require('child_process');
const semver = require('semver');
const chromedriver = require('./').chromedriver;
const packageVersion = require('./package.json').version;

const expectedVersionPrefix =
  'ChromeDriver ' +
  semver.major(packageVersion) +
  '.' +
  semver.minor(packageVersion);

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
