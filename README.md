# Chromedriver

This is a simple package that downloads [Chromedriver](https://sites.google.com/a/chromium.org/chromedriver/) and 
provides a node api for accessing the path to the binary. We want to keep this with minimimal dependencies.


How to use?
```node
const driver = require('@sitespeed.io/chromedriver');

const binPath = driver.binPath();
// launch chromedriver from binPath
```

You can override where you download the Chromedriver by setting *process.env.CHROMEDRIVER_BASE_URL*. You can skip donwloading the Chromedriver by setting *process.env.CHROMEDRIVER_SKIP_DOWNLOAD*.
