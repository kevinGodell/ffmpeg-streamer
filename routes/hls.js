'use strict';

const express = require('express');
const router = express.Router();

router.use('/', (req, res, next) => {
    const app = req.app;
    const mp4frag = app.get('mp4frag');
    if (!mp4frag) {
        res.status(404).send('hls not available');
        res.destroy();
        return;
    }
    res.locals.mp4frag = mp4frag;
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Connection', 'close');
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

router.get('/', (req, res) => {
    res.send('hls router');
});

router.get('/test.m3u8', (req, res) => {
    const mp4frag = res.locals.mp4frag;
    const m3u8 = mp4frag.m3u8;
    if (!m3u8) {
        res.set('Retry-After',  1.0);
        res.status(503).send('m3u8 not ready');
        res.destroy();
        return;
    }
    res.set('Content-Type', 'application/vnd.apple.mpegurl');
    res.end(m3u8);
});

router.get('/test.m3u8.txt', (req, res) => {
    const mp4frag = res.locals.mp4frag;
    const m3u8 = mp4frag.m3u8;
    if (!m3u8) {
        res.set('Retry-After',  1.0);
        res.status(503).send('m3u8 not ready');
        res.destroy();
        return;
    }
    res.set('Content-Type', 'text/plain');
    res.end(m3u8);
});

router.get('/init-test.mp4', (req, res) => {
    const mp4frag = res.locals.mp4frag;
    const initialization = mp4frag.initialization;
    if (!initialization) {
        res.set('Retry-After', 1.0);
        res.status(503).send('initialization not ready');
        res.destroy();
        return;
    }
    res.set('Content-Type', 'video/mp4');
    res.end(mp4frag.initialization);
});

router.get('/test:id.m4s', (req, res) => {
    const mp4frag = res.locals.mp4frag;
    const segment = mp4frag.getHlsSegment(req.params.id);
    if (!segment) {
        res.status(404).send('segment not available');
        res.destroy();
        return;
    }
    res.set('Content-Type', 'video/mp4');
    res.end(segment);
});

module.exports = router;