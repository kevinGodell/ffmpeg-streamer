'use strict';

const namespace = '/progress';

module.exports = (app, io) => {

    io

        .of(namespace)

        .on('connection', (socket) => {

            const ffmpeg = app.get('ffmpeg');

            if (!ffmpeg) {
                socket.disconnect();
                return;
            }

            const emitProgress = () => {
                socket.emit('progress', ffmpeg.progress);
            };

            if (ffmpeg.progress) {
                emitProgress();
            }

            ffmpeg.on('progress', emitProgress);

            socket.once('disconnect', () => {

                if (ffmpeg) {
                    ffmpeg.removeListener('progress', emitProgress);
                }

            });

        });

};