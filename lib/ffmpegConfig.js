'use strict';

function FfmpegConfig(app) {
    let ffmpegPath;
    let ffmpegVersion;
    const binaries = require('ffbinaries').locateBinariesSync('ffmpeg', {paths: [app.get('dirName')], ensureExecutable: true });
    if (binaries.ffmpeg && binaries.ffmpeg.found) {
        ffmpegPath = binaries.ffmpeg.path;
        ffmpegVersion = binaries.ffmpeg.version;
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