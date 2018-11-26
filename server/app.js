const express = require('express');
const compression = require('compression');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Support Gzip
app.use(compression());

// Support post requests with body data (doesn't support multipart, use multer)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Setup logger
app.use(morgan('combined'));

// Serve static assets
app.use(express.static(path.resolve(__dirname, '..', 'build')));

//
const index = require('./routes');
app.use('/*', index);

module.exports = app;
