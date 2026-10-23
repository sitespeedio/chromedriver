# Chromedriver

This is a simple package that downloads [Chromedriver](https://sites.google.com/a/chromium.org/chromedriver/) and provides a node api for accessing the path to the binary. We want to keep this with minimimal dependencies.


How to use?
```node
import driver from '@sitespeed.io/chromedriver';

// Downloads Chromedriver the first time, then returns the path to the binary
const binPath = await driver.ensureBinPath();
// launch chromedriver from binPath
```

The package has no install script, so `npm install` does not download Chromedriver. If you need the driver before the first run, for example when you build a Docker image or on a machine without internet access during tests, download it with:

```
node node_modules/@sitespeed.io/chromedriver/install.js
```

`binPath()` returns the path without a download.

You can override where you download the Chromedriver by setting *process.env.CHROMEDRIVER_BASE_URL*. You can skip downloading the Chromedriver by setting *process.env.CHROMEDRIVER_SKIP_DOWNLOAD*.


You can download another Chromedriver version by setting *process.env.CHROMEDRIVER_VERSION*.

```
CHROMEDRIVER_VERSION=81.0.4044.20 node install.js
```

If you don't set a version, [the version](https://github.com/sitespeedio/chromedriver/blob/master/package.json#L4) in the *package.json* is used. 

