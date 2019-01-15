const proxy = require('http-proxy-middleware');

// TODO import common parts with server/app.js
const SHARE_PROXY_URL = process.env.SHARE_PROXY_URL || 'http://localhost:8080';
const shareProxyOptions = {
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

const BPMN_EDITOR_PROXY_URL = process.env.BPMN_EDITOR_PROXY_URL || 'http://localhost:3000';
const bpmnEditorProxyOptions = {
  target: BPMN_EDITOR_PROXY_URL,
  changeOrigin: true,
  logLevel: 'warn', // ['debug', 'info', 'warn', 'error', 'silent']
  ws: true,
  pathRewrite: {
    '^/share/page/bpmn-editor': '/bpmn-editor'
  }
};

module.exports = function(app) {
  app.use(
    proxy(['/share/**', '!**/card-details', '!**/bpmn-designer', '!**/bpmn-designer/**', '!**/bpmn-editor/**'], {
      ...shareProxyOptions
    })
  );

  app.use(
    proxy(['/share/page/bpmn-editor/**'], {
      ...bpmnEditorProxyOptions
    })
  );
};
