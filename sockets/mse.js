'use strict';

const { Writable } = require('stream');
const namespace = '/mse';

module.exports = function(app, io) {
    io
        .of(namespace)
        .on('connection', (socket)=> {
            const mp4frag = app.get('mp4frag');
            if (!mp4frag) {
                socket.disconnect();
                return;
            }
            const writable = new Writable({
                write(chunk, encoding, callback) {
                    socket.emit('segment', chunk);
                    callback();
                }
            });
            let timestamp = 0;
            socket.on('message', (msg)=> {
                //console.log(`${namespace} message : ${msg}`);
                switch (msg) {
                    //client is requesting mime/codec string
                    case 'mime' :
                        if (mp4frag.mime) {
                            socket.emit('mime', mp4frag.mime);
                        } else {
                            mp4frag.once('initialized', ()=> {
                                socket.emit('mime', mp4frag.mime);
                            });
                        }
                        break;
                    //client is requesting initialization fragment
                    case 'initialization' :
                        if (mp4frag.initialization) {
                            socket.emit('initialization', mp4frag.initialization);
                        } else {
                            mp4frag.once('initialized', ()=> {
                                socket.emit('initialization', mp4frag.initialization);
                            });
                        }
                        break;
                    //client is requesting a SINGLE segment
                    case 'segment' :
                        if (mp4frag.timestamp > timestamp) {
                            socket.emit('segment', mp4frag.segment);
                            timestamp = mp4frag.timestamp;
                        }
                        break;
                    //client is requesting ALL segments
                    case 'segments' :
                        if (mp4frag.segment) {
                            socket.emit('segment', mp4frag.segment);
                        }
                        mp4frag.pipe(writable);
                        break;
                    //client requesting to stop receiving ALL segments
                    case 'stop' :
                        if (mp4frag && writable) {
                            mp4frag.unpipe(writable);
                        }
                        break;
                }
            });
            socket.once('disconnect', ()=> {
                if (mp4frag && writable) {
                    mp4frag.unpipe(writable);
                }
            });
        });
};