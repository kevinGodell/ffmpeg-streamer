'use strict';

const ffmpegConfig = require('../lib/ffmpegConfig');
const ffbinaries = require('ffbinaries');
const namespace = '/install';

let downloading = false;

module.exports = (app, io)=> {
    io
        .of(namespace)
        .on('connection', (socket)=> {
            socket.on('download', ()=> {
                socket.emit('status', {type:'downloading'});
                //socket.broadcast.emit('status', {type:'downloading'});
                if (downloading) {
                    return;
                }
                downloading = true;
                ffbinaries.clearCache();
                const dirName = app.get('dirName');
                ffbinaries.downloadFiles('ffmpeg', {quiet: true, destination: dirName}, (err, data)=> {
                    if (err) {
                        socket.emit('status', {type:'fail', msg: err});
                    } else {
                        const ffmpeg = ffmpegConfig(dirName);
                        app.set('ffmpegVersion', ffmpeg.version);
                        app.set('ffmpegPath', ffmpeg.path);
                        socket.emit('status', {type: 'complete'});
                    }
                    downloading = false;
                });
            });
        });
};