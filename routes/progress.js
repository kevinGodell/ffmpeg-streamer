'use strict';

const express = require('express');
const router = express.Router();

router.use('/', function (req, res, next) {
    const app = req.app;
    const ffmpeg = app.get('ffmpeg');
    if (!ffmpeg) {
        res.sendStatus(503);
        res.destroy();
        return;
    }
    res.locals.ffmpeg = ffmpeg;
    res.set('Connection', 'close');
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

router.get('/test.txt', (req, res) => {
    const ffmpeg = res.locals.ffmpeg;
    if (ffmpeg.progress) {
        res.set('Content-Type', 'text/plain');
        res.end(ffmpeg.progress);
    } else {
        res.sendStatus(503);
        res.destroy();
    }
});

module.exports = router;