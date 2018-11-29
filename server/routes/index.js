const path = require('path');
const fs = require('fs');
const express = require('express');
const router = express.Router();

const replaceAll = function(target, search, replacement) {
  return target.replace(new RegExp(search, 'g'), replacement);
};

const mainRoute = function(req, res) {
  const filePath = path.resolve(__dirname, '..', '..', 'build', 'index.html');

  // TODO read template once, then store it in memory
  fs.readFile(filePath, 'utf8', (err, htmlData) => {
    if (err) {
      console.error('read err', err);
      return res.status(404).end();
    }

    htmlData = replaceAll(htmlData, '{{ASSETS_CACHE}}', '3.5.0.18.11.12.11.59'); // TODO

    res.send(htmlData);
  });
};

router.get('/', mainRoute);
router.get('/share/page/(**/)?card-details', mainRoute);

module.exports = router;
