var cp = require('child_process'),
    semver = require('semver'),
    chromedriver = require('./').chromedriver,
    packageVersion = require('./package.json').version;

var expectedVersionPrefix = 'ChromeDriver ' + semver.major(packageVersion) + '.' + semver.minor(packageVersion);

var driverVersion = cp.execFileSync(chromedriver.binPath(), ['--version']).toString();

if (driverVersion.indexOf(expectedVersionPrefix) !== 0) {
  throw new Error('Expected driver version to be ' + expectedVersionPrefix + ' but it was ' + driverVersion);
}
