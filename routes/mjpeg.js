'use strict';

const express = require('express');
const router = express.Router();
const {Writable} = require('stream');

router.use('/', (req, res, next) => {
    const app = req.app;
    const pipe2jpeg = app.get('pipe2jpeg');
    if (!pipe2jpeg) {
        res.sendStatus(503);
        res.destroy();
        return;
    }
    res.locals.pipe2jpeg = pipe2jpeg;
    res.set('Connection', 'close');
    res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.set('Expires', '-1');
    res.set('Pragma', 'no-cache');
    next();
});

router.get('/test.mjpg', (req, res) => {
    function onJpeg() {
        //clearTimeout(timeOut);
        res.set('Content-Type', 'multipart/x-mixed-replace;boundary=ip_cam_tester');
        //res.set('Transfer-Encoding', '');
        res.write('--ip_cam_tester\r\n');
        res.write(`Content-Type: image/jpeg\r\nContent-Length: ${pipe2jpeg.jpeg.length}\r\n\r\n`);
        res.write(pipe2jpeg.jpeg);
        res.write('\r\n--ip_cam_tester\r\n');
        pipe2jpeg.pipe(writable, {end: true});
    }

    function cleanup() {
        //clearTimeout(timeOut);
        if (pipe2jpeg) {
            pipe2jpeg.removeListener('jpeg', onJpeg);
            pipe2jpeg.unpipe(writable);
        }
    }

    const pipe2jpeg = res.locals.pipe2jpeg;

    const writable = new Writable({
        write(chunk, encoding, callback) {
            res.write(`Content-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`);
            res.write(chunk);
            res.write('\r\n--ip_cam_tester\r\n');
            callback();
        }
    });

    /*const timeOut = setTimeout(() => {
            cleanup();
            res.sendStatus(503);
            res.destroy();
    }, 20000);*/

    res.once('close', () => {
        cleanup();
    });

    if (pipe2jpeg.jpeg) {
        onJpeg();
    } else {
        pipe2jpeg.once('jpeg', onJpeg);
    }

});

module.exports = router;