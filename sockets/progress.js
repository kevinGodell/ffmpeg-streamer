'use strict';

const namespace = '/progress';

module.exports = (app, io) => {

    io

        .of(namespace)

        .on('connection', (socket) => {

            function emitProgress() {

                if (!ffmpeg.progress) {
                    return;
                }

                socket.emit('progress', ffmpeg.progress);

            }

            const ffmpeg = app.get('ffmpeg');

            if (!ffmpeg) {
                socket.disconnect();
                return;
            }

            if (ffmpeg.progress) {
                socket.emit('progress', ffmpeg.progress);
            }

            socket.on('progressRequest', emitProgress);

            socket.once('disconnect', () => {

                if (socket) {
                    socket.removeListener('progressRequest', emitProgress);
                }

            });

        });

};