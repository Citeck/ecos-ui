const express = require('express');
const compression = require('compression');
// const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');
const proxy = require('http-proxy-middleware');

const app = express();

// Support Gzip
app.use(compression());

// Support post requests with body data (doesn't support multipart, use multer)
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: false }));

// Setup logger
app.use(morgan('combined'));

// Serve static assets
app.use(express.static(path.resolve(__dirname, '..', 'build')));

// React app route
const index = require('./routes');
app.use('/', index);

// proxy to /share
const SHARE_PROXY_URL = process.env.PROXY_URL || 'http://localhost:8080';
const shareProxy = proxy({
  target: SHARE_PROXY_URL,
  changeOrigin: true,
  logLevel: 'debug',
  ws: true,
  onProxyRes: (proxyRes, req, res) => {
    // redirect from 8080 to 3000
    if ([302, ].indexOf(proxyRes.statusCode) > -1 && proxyRes.headers.location) {
      let redirectLocation = proxyRes.headers.location;
      console.log('Received code ' + proxyRes.statusCode + ' from API Server for URL - ' + redirectLocation);

      redirectLocation = redirectLocation.replace(SHARE_PROXY_URL, '');
      console.log('Redirect location changed to ' + redirectLocation);

      proxyRes.headers.location = redirectLocation;
    }
  }
});

app.use('/share', shareProxy);

module.exports = app;
