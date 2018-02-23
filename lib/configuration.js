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
            ffmpegLocalPath = `${dirName}/ffmpeg.exe`;
            break;
        case 'linux':
            configuration.osType = `Linux_${os.arch()}`;
            ffmpegLocalPath = `${dirName}\\ffmpeg`;
            break;
        case 'darwin':
            configuration.osType = `Mac_${os.arch()}`;
            ffmpegLocalPath = `${dirName}/ffmpeg`;
            break;
        default :
            throw new Error('unable to determine operating system');
    }
    if (fs.existsSync(ffmpegLocalPath)) {
        console.log(`ffmpeg was found locally at ${ffmpegLocalPath}`);
        console.log('need to check executable permissions for ffmpeg');
        try {
            console.log('first try block');
            fs.accessSync(ffmpegLocalPath, fs.constants.X_OK);
            //if this threw error, no lines get called beneath
            configuration.ffmpegPath = ffmpegLocalPath;
            console.log('already executable');
        } catch (err) {

            console.log(err.message);

            //now try to change permissions to make executable
            console.log('trying to change perms');

            try {

                console.log(execSync(`chmod +x ${ffmpegLocalPath}`).toString());
                configuration.ffmpegPath = ffmpegLocalPath;

            } catch (err) {

                console.error(`Unable to set executable permissions for ${ffmpegLocalPath}`);
                console.log('set ffmpeg to global path so we can try to test version');
                configuration.ffmpegPath = 'ffmpeg';

            }

        }


    } else {
        console.log('ffmpeg was not found locally, attempting to use ffmpeg that might be in PATH');
        configuration.ffmpegPath = 'ffmpeg';
    }

    try {

        const ffmpegVersion = execSync(`${configuration.ffmpegPath} -version`).toString().split(' ')[2];

        configuration.ffmpegVersion = ffmpegVersion;


    } catch (err) {
        configuration.ffmpegVersion = null;
    }


    return configuration;
}

module.exports = Configuration;