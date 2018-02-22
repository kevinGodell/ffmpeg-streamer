'use strict';

const namespace = '/progress';

module.exports = function(app, io) {
    io
        .of(namespace)
        .on('connection', (socket)=> {
            const ffmpeg = app.get('ffmpeg');
            if (!ffmpeg) {
                socket.disconnect();
                return;
            }
            if (ffmpeg.progress) {
                socket.emit('progress', ffmpeg.progress);
            }
            socket.on('request', function() {
                if (ffmpeg.progress) {
                    socket.emit('progress', ffmpeg.progress);
                }
            });
        });
};