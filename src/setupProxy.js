const proxy = require('http-proxy-middleware');
const fs = require('fs');

console.log('Setup proxy...');

const PROXY_URL = {
  SHARE: process.env.SHARE_PROXY_URL || 'http://localhost:8080',
  GATEWAY_RECORDS: process.env.GATEWAY_RECORDS_PROXY_URL || process.env.SHARE_PROXY_URL || 'http://localhost'
};

console.log('==============Dev Server Proxy URL==============');
{
  const MAX_LEN = Object.keys(PROXY_URL).reduce((maxLen, str) => Math.max(str.length, maxLen), 0);
  for (let key in PROXY_URL) {
    console.log(key.padEnd(MAX_LEN) + '  =  ' + PROXY_URL[key]);
  }
}
console.log('=============/Dev Server Proxy URL==============');

let reqCookies = '';
let isCookiesSent = false;

function runCookiesWatcher() {
  const cookiesFileName = '.cookies';

  const setReqCookie = () => {
    fs.readFile(cookiesFileName, (err, buf) => {
      if (err) {
        console.log(`Can't read ${cookiesFileName}`);
        return;
      }

      reqCookies = buf.toString().trim();
      isCookiesSent = false;
      console.log(`Set cookies:${reqCookies}!!!`);
    });
  };

  if (!fs.existsSync(cookiesFileName)) {
    try {
      fs.writeFileSync(cookiesFileName, '');
    } catch (e) {
      console.log(`Can't create ${cookiesFileName}`);
      return;
    }
  } else {
    setReqCookie();
  }

  fs.watchFile(cookiesFileName, setReqCookie);
}

runCookiesWatcher();

const onProxyReq = function(req) {
  if (reqCookies && !isCookiesSent) {
    console.log(`setHeader[Cookie]:${reqCookies}!!!`);
    req.setHeader('cookie', reqCookies);
    // reqCookies = '';
    isCookiesSent = true;
  }
};

// TODO import common parts with server/app.js
const shareProxyOptions = {
  target: PROXY_URL.SHARE,
  changeOrigin: true,
  secure: false,
  logLevel: 'warn', // ['debug', 'info', 'warn', 'error', 'silent']
  ws: true,
  onProxyReq,
  onProxyRes: (proxyRes, req, res) => {
    // redirect from share proxy to ecos-ui (http://localhost:3000 by default)
    if ([302].indexOf(proxyRes.statusCode) > -1 && proxyRes.headers.location) {
      let redirectLocation = proxyRes.headers.location;
      console.log('Received code ' + proxyRes.statusCode + ' from API Server for URL - ' + redirectLocation);

      if (PROXY_URL.SHARE.startsWith('https:') && redirectLocation.startsWith('http:')) {
        redirectLocation = redirectLocation.replace(/http:/, 'https:');
        console.log('Change http to https: ' + redirectLocation);
      }
      redirectLocation = redirectLocation.replace(new RegExp(PROXY_URL.SHARE, 'g'), '');
      if (redirectLocation === '/share') {
        redirectLocation = '/v2/dashboard';
      }
      console.log('Redirect location changed to ' + redirectLocation);

      proxyRes.headers.location = redirectLocation;
    }
  }
};

const bpmnEditorProxyOptions = {
  target: PROXY_URL.SHARE,
  changeOrigin: true,
  logLevel: 'warn', // ['debug', 'info', 'warn', 'error', 'silent']
  ws: true,
  pathRewrite: {
    '^/share/page/bpmn-editor': '/bpmn-editor'
  }
};

const gatewayRecordsProxyOptions = {
  target: PROXY_URL.GATEWAY_RECORDS,
  changeOrigin: true,
  secure: false,
  logLevel: 'warn', // ['debug', 'info', 'warn', 'error', 'silent']
  ws: true
};

module.exports = function(app) {
  app.use(
    proxy(['/gateway/api/records', '/logout', '/eis.json'], {
      ...gatewayRecordsProxyOptions
    })
  );

  app.use(
    proxy(['/flowable-modeler', '/flowable-idm'], {
      ...shareProxyOptions
    })
  );

  app.use(
    proxy(
      [
        '/gateway/**',
        '/share/**',
        '!/gateway/api/records/**',
        '!**/card-details-new',
        '!**/bpmn-designer',
        '!**/bpmn-designer/**',
        '!**/bpmn-editor',
        '!**/bpmn-editor/**',
        '!**/ui/journals',
        '!**/journalsDashboard',
        '/build-info/**'
      ],
      {
        ...shareProxyOptions
      }
    )
  );

  app.use(
    proxy(['/share/page/bpmn-editor/**'], {
      ...bpmnEditorProxyOptions
    })
  );
};
