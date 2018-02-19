'use strict';

const express = require('express');
const router = express.Router();
const { Writable } = require('stream');

router.use('/', function (req, res, next) {
    const app = req.app;
    const pipe2jpeg = app.get('pipe2jpeg');
    if (!pipe2jpeg) {
        res.sendStatus(503);
        return;
    }
    res.locals.pipe2jpeg = pipe2jpeg;
    next();
});

router.get('/test.mjpg', (req, res) => {
    const pipe2jpeg = res.locals.pipe2jpeg;
    res.setHeader('Content-Type', 'multipart/x-mixed-replace;boundary=ip_cam_tester');
    res.setHeader('Transfer-Encoding', '');
    res.write('--ip_cam_tester\r\n');
    const jpeg = pipe2jpeg.jpeg;
    if (jpeg) {
        res.write(`Content-Type: image/jpeg\r\nContent-Length: ${jpeg.length}\r\n\r\n`);
        res.write(jpeg);
        res.write('\r\n--ip_cam_tester\r\n');
    }
    const writable = new Writable({
        write(chunk, encoding, callback) {
            res.write(`Content-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`);
            res.write(chunk);
            res.write('\r\n--ip_cam_tester\r\n');
            callback();
        }
    });
    pipe2jpeg.pipe(writable);
    res.once('close', ()=> {
        if (pipe2jpeg) {
            pipe2jpeg.unpipe(writable);
        }
    });
});

module.exports = router;