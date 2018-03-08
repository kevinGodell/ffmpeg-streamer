'use strict';

const namespace = '/m3u8';

module.exports = function(app, io) {
    io
        .of(namespace)
        .on('connection', (socket)=> {
            const mp4frag = app.get('mp4frag');
            if (!mp4frag) {
                socket.disconnect();
                return;
            }
            if (mp4frag.m3u8) {
                socket.emit('m3u8', mp4frag.m3u8);
            }
            const emitM3u8 = () => {
                socket.emit('m3u8', mp4frag.m3u8);
            };
            socket.on('m3u8Request', emitM3u8);
            socket.once('disconnect', () => {
                if (socket) {
                    socket.removeListener('m3u8Request', emitM3u8);
                }
            });
        });
};