'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

function Configuration() {
    const configuration = {};
    let dirName;
    let ffmpegLocalPath;

    if (process.pkg && process.pkg.entrypoint) {
        dirName = path.dirname(process.execPath);
    } else {
        dirName = process.cwd();
    }

    switch (os.platform()) {
        case 'win32':
            configuration.osType = `Windows_${os.arch()}`;
            ffmpegLocalPath = path.resolve(`${dirName}/ffmpeg.exe`);
            break;
        case 'linux':
            configuration.osType = `Linux_${os.arch()}`;
            ffmpegLocalPath = path.resolve(`${dirName}/ffmpeg`);
            break;
        case 'darwin':
            configuration.osType = `macOS_${os.arch()}`;
            ffmpegLocalPath = path.resolve(`${dirName}/ffmpeg`);
            break;
        default :
            throw new Error('unable to determine operating system');
    }

    if (fs.existsSync(ffmpegLocalPath)) {
        try {
            fs.accessSync(ffmpegLocalPath, fs.constants.X_OK);
            configuration.ffmpegPath = ffmpegLocalPath;
        } catch (err) {
            console.error(err.message);
            try {
                execSync(`chmod +x ${ffmpegLocalPath}`);
                configuration.ffmpegPath = ffmpegLocalPath;
            } catch (err) {
                console.error(err);
                configuration.ffmpegPath = 'ffmpeg';
            }
        }
    } else {
        configuration.ffmpegPath = 'ffmpeg';
    }

    try {
        configuration.ffmpegVersion = execSync(`${configuration.ffmpegPath} -version`).toString().split(' ')[2];
    } catch (err) {
        configuration.ffmpegVersion = null;
    }

    return configuration;
}

module.exports = Configuration;