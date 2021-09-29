const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const favicon = require('serve-favicon')
const path = require('path');
const proxy = require('http-proxy-middleware');
const fs = require('fs');

const app = express();
const router = express.Router();

// Support Gzip
app.use(compression());

// Setup logger
app.use(morgan('combined'));

app.use(favicon(path.join(__dirname, './public', '/favicon.ico')));

// Serve static assets
app.use(express.static(path.resolve(__dirname, '..', 'build')));

// React app routes
const mainRoute = createMainRoute();
const bpmnEditorRoute = createBpmnEditorRoute();

router.get(['/', '/share/page/(**/)?card-details', '/share/page/bpmn-designer(/**)?'], mainRoute);
router.get(['/v2/*'], mainRoute);
router.get(['/share/page/bpmn-editor'], bpmnEditorRoute);

app.use('/', router);

// Proxy to /share
const SHARE_PROXY_URL = process.env.SHARE_PROXY_URL;
if (!SHARE_PROXY_URL) {
  console.error('Environment variable SHARE_PROXY_URL is not set');
  process.exit(1);
}

const proxyOptions = {
  target: SHARE_PROXY_URL,
  changeOrigin: true,
  secure: false,
  logLevel: 'warn', // ['debug', 'info', 'warn', 'error', 'silent']
  ws: true,
  onProxyRes: (proxyRes, req, res) => {
    // redirect from 8080 to 3000
    if ([302].indexOf(proxyRes.statusCode) > -1 && proxyRes.headers.location) {
      let redirectLocation = proxyRes.headers.location;
      console.log('Received code ' + proxyRes.statusCode + ' from API Server for URL - ' + redirectLocation);

      redirectLocation = redirectLocation.replace(new RegExp(SHARE_PROXY_URL, 'g'), '');
      console.log('Redirect location changed to ' + redirectLocation);

      proxyRes.headers.location = redirectLocation;
    }
  }
};
const shareProxy = proxy(proxyOptions);
app.use('/share', shareProxy);
app.use('/flowable-modeler', shareProxy);
app.use('/flowable-idm', shareProxy);

// Run app
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}!`);
});
app.on('error', onError);

// ----------------
// functions

function createMainRoute() {
  const assetsCacheHash = generateAssetsCacheHash();

  const filePath = path.resolve(__dirname, '..', 'build', 'index.html');
  const indexHtmlData = fs.readFileSync(filePath, 'utf8');

  return (req, res) => {
    let htmlData = replaceAll(indexHtmlData, '{ASSETS_CACHE}', assetsCacheHash);
    // TODO inject locale to /share/service/messages.js and html lang
    // TODO detect mobile device and inject classes
    // TODO inject theme class

    res.send(htmlData);
  };
}

// TODO combine with createMainRoute and rid of duplicate code
function createBpmnEditorRoute() {
  const assetsCacheHash = generateAssetsCacheHash();

  const filePath = path.resolve(__dirname, '..', 'build', 'bpmn-editor', 'index.html');
  const indexHtmlData = fs.readFileSync(filePath, 'utf8');

  return (req, res) => {
    let htmlData = replaceAll(indexHtmlData, '{ASSETS_CACHE}', assetsCacheHash);
    // TODO inject locale to /share/service/messages.js and html lang
    // TODO detect mobile device and inject classes
    // TODO inject theme class

    res.send(htmlData);
  };
}

function generateAssetsCacheHash() {
  let version = process.env.RELEASE_VERSION || 'x.x.x';

  const dt = new Date();
  version = `${version}.${dt
    .getFullYear()
    .toString()
    .slice(2)}.${dt.getMonth() + 1}.${dt.getDate()}.${dt.getHours()}.${dt.getMinutes()}`;

  return version;
}

function replaceAll(target, search, replacement) {
  return target.replace(new RegExp(search, 'g'), replacement);
}

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = 'Port ' + PORT;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// ----------------
