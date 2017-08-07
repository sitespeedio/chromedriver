# Chromedriver

This is a simple package that downloads [Chromedriver](https://sites.google.com/a/chromium.org/chromedriver/) and 
provides a node api for accessing the path to the binary. There are other packages like this, but I wanted to make sure
I had an updated package to include in [Browsertime](http://www.browsertime.net).

How to use?
```node
const driver = require('@sitespeed.io/chromedriver');

const binPath = driver.binPath();
// launch chromedriver from binPath
```

You can override where you download the Chromedriver by setting *process.env.CHROMEDRIVER_BASE_URL*.
