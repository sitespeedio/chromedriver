# Chromedriver

This is a simple package that downloads [Chromedriver](https://sites.google.com/a/chromium.org/chromedriver/) and 
provides a node api for accessing the path to the binary. There are other packages like this, but I wanted to make sure
I had an updated package to include in [Browsertime](http://www.browsertime.net).

How to use?
```node
var driver = require('@sitespeed.io/chromedriver').chromedriver;

var p = driver.binPath();
// launch chromedriver from path
```

You can ovveride where you download the Chromedriver by setting *process.env.CHROMEDRIVER_BASE_URL*.
