'use strict';

const express = require('express');
const router = express.Router();
const path = require('path');

const flvMinJs = path.join(__dirname, '../node_modules/flv.js/dist/flv.min.js');
const flvMinJsMap = path.join(__dirname, '../node_modules/flv.js/dist/flv.min.js.map');
const hlsMinJs = path.join(__dirname, '../node_modules/hls.js/dist/hls.min.js');

router.get('/', (req, res) => {
    res.send('assets router');
});

router.get('/flv.min.js', (req, res) => {
    res.sendFile(flvMinJs);
});

router.get('/flv.min.js.map', (req, res) => {
    res.sendFile(flvMinJsMap);
});

router.get('/hls.min.js', (req, res) => {
    res.sendFile(hlsMinJs);
});

module.exports = router;