import dotenv from 'dotenv';
import dotenvExpand from 'dotenv-expand';
import express from 'express';
import fs from 'fs';
import proxy from 'http-proxy-middleware';
import path from 'path';
// eslint-disable-next-line import/default
import ViteExpress from 'vite-express';

// ================= ENV ===================
const isDevStage = process.env.NODE_ENV === 'dev-stage';
const isDev = process.env.NODE_ENV === 'development';

const pathDevelopment = '.env.development';
const pathDevelopmentLocal = '.env.development.local';

const envFile = fs.existsSync(pathDevelopmentLocal) ? pathDevelopmentLocal : fs.existsSync(pathDevelopment) ? pathDevelopment : null;

if (envFile) {
  console.log(`✅ Loading variables from ${envFile}`);
  const envConfig = dotenv.config({ path: envFile });
  dotenvExpand.expand(envConfig);
} else {
  console.warn(`⚠ Not found ${pathDevelopmentLocal} or ${pathDevelopment}`);
}

const PROXY_URL = {
  SHARE: process.env.SHARE_PROXY_URL || 'http://localhost:8080'
};

const shareProxyOptions = {
  target: PROXY_URL.SHARE,
  changeOrigin: true,
  secure: false
};

// ======================== APP SETTINGS ========================

const app = express();
const router = express.Router();

if (isDev) {
  // We do NOT register createMainRoute in dev — vite-express / Vite middleware will handle it itself index.html
  console.log('🟢 Running in development mode — letting vite-express serve index.html');
} else if (isDevStage) {
  router.get(['/', '/v2', '/v2/*'], (req, res) => {
    res.sendFile(path.resolve(process.cwd(), 'build', 'index.html'));
  });
} else {
  router.get(['/', '/v2', '/v2/*'], createMainRoute());
}

// Proxy to /share
const SHARE_PROXY_URL = process.env.SHARE_PROXY_URL;
if (!SHARE_PROXY_URL) {
  console.error('Environment variable SHARE_PROXY_URL is not set');
  process.exit(1);
}

const shareProxy = proxy(shareProxyOptions);
app.use('/logout', shareProxy);
app.use('/eis.json', shareProxy);
app.use('/onlyoffice/', shareProxy);
app.use('/gateway/**', shareProxy);
app.use('/build-info/**', shareProxy);
app.use('/', router);

// Static files
if (isDevStage) {
  app.use(express.static(path.resolve(process.cwd(), 'build')));
} else {
  app.use(express.static(path.resolve(process.cwd(), 'public')));
}

// ViteExpress.static() - dev-asset middleware
app.use(ViteExpress.static());

// Run app
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.clear();
  console.log(
    '\x1b[36m',
    `
    ╔════════════════════════════════════════════════════
    ║    Server is running on http://localhost:${PORT} 🌐
    ║    Proxy from ${PROXY_URL.SHARE}
    ║    Enjoy your development! 🚀
    ║    Press Ctrl+C to stop the server
    ╚════════════════════════════════════════════════════
  `,
    '\x1b[0m'
  );
});

if (!isDevStage) {
  ViteExpress.bind(app, server);
}

/* ----------------- Helpers ----------------- */

function createMainRoute() {
  const assetsCacheHash = generateAssetsCacheHash();

  const filePath = path.resolve(process.cwd(), 'index.html');
  const indexHtmlData = fs.readFileSync(filePath, 'utf8');

  return (req, res) => {
    let htmlData = replaceAll(indexHtmlData, '{ASSETS_CACHE}', assetsCacheHash);
    // TODO inject locale to /share/service/messages.js and html lang
    // TODO detect mobile device and inject classes
    // TODO inject theme class

    res.setHeader('Content-Type', 'text/html');
    res.send(htmlData);
  };
}

function generateAssetsCacheHash() {
  let version = process.env.RELEASE_VERSION || 'x.x.x';

  const dt = new Date();
  version = `${version}.${dt.getFullYear().toString().slice(2)}.${dt.getMonth() + 1}.${dt.getDate()}.${dt.getHours()}.${dt.getMinutes()}`;

  return version;
}

function replaceAll(target, search, replacement) {
  return target.replace(new RegExp(search, 'g'), replacement);
}
