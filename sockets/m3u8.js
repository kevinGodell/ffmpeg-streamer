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
            socket.on('request', function() {
                if (mp4frag.m3u8) {
                    socket.emit('m3u8', mp4frag.m3u8);
                }
            });
        });
};