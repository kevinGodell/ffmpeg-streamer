'use strict';

const express = require('express');
const router = express.Router();

router.use('/', (req, res) => {

    const app = req.app;

    const ffmpegPath = app.get('ffmpegPath');

    if (!ffmpegPath) {
        res.render('install', {
            title: 'FFMPEG Dependency Error',
            subTitle: 'Not found on system.',
            message: `Would you like to install an updated copy of ffmpeg in this directory?`,
            directory: app.get('dirName')
        });
        return;
    }

    res.render('install', {
        title: 'FFMPEG Dependency OK',
        subTitle: `Found @ ${ffmpegPath}`,
        message: `Would you like to install an updated copy of ffmpeg in this directory?`,
        directory: app.get('dirName')
    });

});

module.exports = router;