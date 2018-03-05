'use strict';

const {Writable} = require('stream');
const namespace = '/jpeg';

module.exports = function (app, io) {

    let writable;
    let clients = 0;

    io
        .of(namespace)

        .on('connection', (socket) => {

            clients = Object.keys(io.of(namespace).sockets).length;

            const pipe2jpeg = app.get('pipe2jpeg');

            if (!pipe2jpeg) {
                socket.disconnect();
                return;
            }

            if (pipe2jpeg.jpeg) {
                socket.emit('jpeg', pipe2jpeg.jpeg);
            }

            if (!writable) {

                writable = new Writable({
                    write(chunk, encoding, callback) {
                        io.of(namespace).emit('jpeg', chunk);
                        callback();
                    }
                });

                pipe2jpeg.pipe(writable);

            }

            socket.once('disconnect', () => {

                clients = Object.keys(io.of(namespace).sockets).length;

                if (pipe2jpeg && writable && clients < 1) {
                    pipe2jpeg.unpipe(writable);
                    writable = null;
                }

            });

        });

};