'use strict';

const ffbinaries = require('ffbinaries');

function FfmpegConfig(app) {
    let ffmpegPath;
    let ffmpegVersion;
    const ffmpeg = ffbinaries.locateBinariesSync('ffmpeg', {paths: [app.get('dirName')], ensureExecutable: true }).ffmpeg;
    console.log(ffmpeg);
    if (ffmpeg && ffmpeg.found) {
        ffmpegPath = ffmpeg.path;
        ffmpegVersion = ffmpeg.version;
    } else {
        ffmpegPath = null;
        ffmpegVersion = null;
    }
    app.set('ffmpegVersion', ffmpegVersion);
    app.set('ffmpegPath', ffmpegPath);
    return {
        ffmpegVersion: ffmpegVersion,
        ffmpegPath: ffmpegPath
    };
}

module.exports = FfmpegConfig;