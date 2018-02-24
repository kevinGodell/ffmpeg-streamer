'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

function Configuration(app) {
    let osType;
    let dirName;
    let ffmpegLocalPath;
    let ffmpegPath;
    let ffmpegVersion;

    if (process.pkg && process.pkg.entrypoint) {
        dirName = path.dirname(process.execPath);
    } else {
        dirName = process.cwd();
    }

    switch (os.platform()) {
        case 'win32':
            osType = `Windows_${os.arch()}`;
            ffmpegLocalPath = path.resolve(`${dirName}/ffmpeg.exe`);
            break;
        case 'linux':
            osType = `Linux_${os.arch()}`;
            ffmpegLocalPath = path.resolve(`${dirName}/ffmpeg`);
            break;
        case 'darwin':
            osType = `macOS_${os.arch()}`;
            ffmpegLocalPath = path.resolve(`${dirName}/ffmpeg`);
            break;
        default :
            throw new Error('unable to determine operating system');
    }

    if (fs.existsSync(ffmpegLocalPath)) {
        try {
            fs.accessSync(ffmpegLocalPath, fs.constants.X_OK);
            ffmpegPath = ffmpegLocalPath;
        } catch (err) {
            console.error(err.message);
            try {
                execSync(`chmod +x ${ffmpegLocalPath}`);
                ffmpegPath = ffmpegLocalPath;
            } catch (err) {
                console.error(err);
                ffmpegPath = 'fffmpeg';
            }
        }
    } else {
        ffmpegPath = 'fffmpeg';
    }

    try {
        ffmpegVersion = execSync(`${ffmpegPath} -version`).toString().split(' ')[2];
    } catch (err) {
        ffmpegVersion = null;
    }

    app.set('dirName', dirName);
    app.set('osType', osType);
    app.set('ffmpegVersion', ffmpegVersion);
    app.set('ffmpegPath', ffmpegPath);

    return {
        dirName: dirName,
        osType: osType,
        ffmpegVersion: ffmpegVersion,
        ffmpegPath: ffmpegPath
    };

}

module.exports = Configuration;