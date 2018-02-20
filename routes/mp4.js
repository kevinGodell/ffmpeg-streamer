'use strict';

const express = require('express');
const router = express.Router();

router.use('/', function (req, res, next) {
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

router.get('/test.mp4', (req, res) => {
    function onInit() {
        //clearTimeout(timeOut);
        res.write(mp4frag.initialization);
        if (mp4frag.segment) {
            console.log('already has segment');
            res.write(mp4frag.segment);
        }
        mp4frag.pipe(res, {end: true});
    }

    function cleanup() {
        //clearTimeout(timeOut);
        if (mp4frag) {
            mp4frag.removeListener('initialized', onInit);
            mp4frag.unpipe(res);
        }
    }

    const mp4frag = res.locals.mp4frag;

    /*const timeOut = setTimeout(() => {
        cleanup();
        res.sendStatus(503);
        res.destroy();
    }, 20000);*/

    res.once('close', ()=> {
        cleanup();
    });

    if (mp4frag.initialization) {
        onInit();
    } else {
        mp4frag.once('initialized', onInit);
    }

});

module.exports = router;