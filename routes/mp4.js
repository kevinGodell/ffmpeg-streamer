'use strict';

const express = require('express');
const router = express.Router();

router.use('/', (req, res, next) => {
    const app = req.app;
    const mp4frag = app.get('mp4frag');
    if (!mp4frag) {
        res.sendStatus(503);
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

    const onInit = () => {
        res.set('Content-Type', 'video/mp4');
        res.write(mp4frag.initialization);
        if (mp4frag.segment) {
            res.write(mp4frag.segment);
        }
        mp4frag.pipe(res, {end: true});
    };

    const cleanup = () => {
        res.removeListener('close', cleanup);
        res.destroy();
        if (mp4frag) {
            mp4frag.removeListener('initialized', onInit);
            mp4frag.unpipe(res);
        }
    };

    res.once('close', cleanup);

    if (mp4frag.initialization) {
        onInit();
    } else {
        mp4frag.once('initialized', onInit);
    }

});

module.exports = router;