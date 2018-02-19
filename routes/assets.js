'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');

const flvMinJs = path.join(__dirname, '../node_modules/flv.js/dist/flv.min.js');
const hlsMinJs = path.join(__dirname, '../node_modules/hls.js/dist/hls.min.js');
const materialMinJs = path.join(__dirname, '../node_modules/material-design-lite/dist/material.min.js');
const materialRedOrangeMinCss = path.join(__dirname, '../node_modules/material-design-lite/dist/material.red-orange.min.css');

router.get('/', function(req, res) {
  res.send('assets router');
});

router.get('/flv.min.js', (req, res) => {
    res.sendFile(flvMinJs);
});

router.get('/hls.min.js', (req, res) => {
    res.sendFile(hlsMinJs);
});

router.get('/material.min.js', (req, res) => {
    res.sendFile(materialMinJs);
});

router.get('/material.red-orange.min.css', (req, res) => {
    res.sendFile(materialRedOrangeMinCss);
});

module.exports = router;
