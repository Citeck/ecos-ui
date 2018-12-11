const proxy = require('http-proxy-middleware');

// TODO import common parts with server/app.js
const SHARE_PROXY_URL = process.env.PROXY_URL || 'http://localhost:8080';
const proxyOptions = {
  target: SHARE_PROXY_URL,
  changeOrigin: true,
  logLevel: 'warn', // ['debug', 'info', 'warn', 'error', 'silent']
  ws: true,
  onProxyRes: (proxyRes, req, res) => {
    // redirect from 8080 to 3000
    if ([302].indexOf(proxyRes.statusCode) > -1 && proxyRes.headers.location) {
      let redirectLocation = proxyRes.headers.location;
      console.log('Received code ' + proxyRes.statusCode + ' from API Server for URL - ' + redirectLocation);

      redirectLocation = redirectLocation.replace(SHARE_PROXY_URL, '');
      console.log('Redirect location changed to ' + redirectLocation);

      proxyRes.headers.location = redirectLocation;
    }
  }
};

module.exports = function(app) {
  app.use(
    proxy(['/share/**', '!**/card-details', '!**/bpmn-designer', '!**/bpmn-designer/**'], {
      ...proxyOptions
    })
  );
};
