'use strict';

const express = require('express');
const router = express.Router();

router.use('/', function (req, res, next) {
    const app = req.app;
    const mp4frag = app.get('mp4frag');
    if (!mp4frag) {
        res.sendStatus(503);
        return;
    }
    res.locals.mp4frag = mp4frag;
    next();
});

router.get('/test.m3u8', (req, res) => {
    const mp4frag = res.locals.mp4frag;
    if (mp4frag.m3u8) {
        res.writeHead(200, {'Content-Type': 'application/vnd.apple.mpegurl'});
        res.end(mp4frag.m3u8);
    } else {
        mp4frag.once('segment', () => {
            res.writeHead(200, {'Content-Type': 'application/vnd.apple.mpegurl'});
            res.end(mp4frag.m3u8);
        });
    }
});

router.get('/init-test.mp4', (req, res) => {
    const mp4frag = res.locals.mp4frag;
    if (mp4frag.initialization) {
        res.writeHead(200, {'Content-Type': 'video/mp4'});
        res.end(mp4frag.initialization);
    } else {
        mp4frag.once('initialized', () => {
            res.writeHead(200, {'Content-Type': 'video/mp4'});
            res.end(mp4frag.initialization);
        });
    }
});

router.get('/test:id.m4s', (req, res) => {
    const mp4frag = res.locals.mp4frag;
    const segment = mp4frag.getHlsSegment(req.params.id);
    if (segment) {
        res.writeHead(200, {'Content-Type': 'video/mp4'});
        res.end(segment);
    } else {
        res.sendStatus(404);
    }
});

module.exports = router;