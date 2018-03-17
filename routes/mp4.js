'use strict';

const express = require('express');
const router = express.Router();

router.use('/', (req, res, next) => {
    const app = req.app;
    const mp4frag = app.get('mp4frag');
    if (!mp4frag) {
        res.status(404).send('mp4 not available');
        res.destroy();
        return;
    }
    if (!mp4frag.initialization) {
        res.status(503).send('mp4 not ready');
        res.destroy();
        return;
    }
    res.locals.mp4frag = mp4frag;
    res.set('Connection', 'close');
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

router.get('/', (req, res) => {
    res.send('mp4 router');
});

router.get('/test.mp4', (req, res) => {
    const mp4frag = res.locals.mp4frag;
    res.set('Content-Type', 'video/mp4');
    res.write(mp4frag.initialization);
    if (mp4frag.segment) {
        res.write(mp4frag.segment);
    }
    mp4frag.pipe(res, {end: true});
    res.once('close', () => {
        if (mp4frag) {
            mp4frag.unpipe(res);
        }
        res.destroy();
    });
});

module.exports = router;