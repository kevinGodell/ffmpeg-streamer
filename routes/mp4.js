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
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    next();
});

router.get('/test.mp4', (req, res) => {
    const mp4frag = res.locals.mp4frag;
    if (mp4frag.initialization) {
        res.write(mp4frag.initialization);
        mp4frag.pipe(res);
        res.once('close', () => {
            mp4frag.unpipe(res);
        });
    } else {
        mp4frag.once('initialized', (data) => {
            res.write(data.initialization);
            mp4frag.pipe(res);
            res.once('close', () => {
                mp4frag.unpipe(res);
            });
        });
    }
});

module.exports = router;