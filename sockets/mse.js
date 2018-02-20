'use strict';

const { Writable } = require('stream');
const namespace = '/mse';

module.exports = function(app, io) {
    io
        .of(namespace)
        .on('connection', (socket) => {
            console.log(`A user connected to namespace "${namespace}"`);

            const mp4frag = app.get('mp4frag');

            if(!mp4frag) {
                console.log('no mp4frag');
                socket.disconnect();
                return;
            }

            const writable = new Writable({
                write(chunk, encoding, callback) {
                    socket.emit('segment', chunk);
                    callback();
                }
            });

            socket.on('message', (msg) => {
                console.log(`${namespace} message : ${msg}`);
                switch (msg) {
                    case 'mime' ://client is requesting mime/codec string
                        if (mp4frag.mime) {
                            socket.emit('mime', mp4frag.mime);
                        } else {
                            mp4frag.once('initialized', ()=>{
                                socket.emit('mime', mp4frag.mime);
                            });
                        }
                        break;
                    case 'initialization' ://client is requesting initialization fragment
                        if (mp4frag.initialization) {
                            socket.emit('initialization', mp4frag.initialization);
                        } else {
                            mp4frag.once('initialized', ()=>{
                                socket.emit('initialization', mp4frag.initialization);
                            });
                        }
                        break;
                    case 'segment' ://client is requesting a SINGLE segment

                        break;
                    case 'segments' ://client is requesting ALL segments
                        if (mp4frag.segment) {
                            socket.emit('segment', mp4frag.segment);
                        }
                        mp4frag.pipe(writable);
                        break;
                    case 'pause' :
                        //pauseReq();
                        break;
                    case 'resume' :
                        //resumeReq();
                        break;
                    case 'stop' ://client requesting to stop receiving segments
                        //stopReq();
                        break;
                }
            });

            socket.once('disconnect', () => {
                if (mp4frag && writable) {
                    mp4frag.unpipe(writable);
                }
                console.log(`A user disconnected from namespace "${namespace}"`);
            });


            /*
            //event listener
            const onInitialized = () => {
                socket.emit('mime', mp4frag.mime);
                mp4frag.removeListener('initialized', onInitialized);
            };

            //event listener
            const onSegment = (data) => {
                socket.emit('segment', data);
                //console.log('emit segment', data.length);
            };

            //client request
            const mimeReq = () => {
                if (mp4frag.mime) {
                    console.log(`${namespace} : ${mp4frag.mime}`);
                    socket.emit('mime', mp4frag.mime);
                } else {
                    mp4frag.on('initialized', onInitialized);
                }
            };

            //client request
            const initializationReq = () => {
                socket.emit('initialization', mp4frag.initialization);
            };

            //client request
            const segmentsReq = () => {
                //send current segment first to start video asap
                if (mp4frag.segment) {
                    socket.emit('segment', mp4frag.segment);
                }
                //add listener for segments being dispatched by mp4frag
                mp4frag.on('segment', onSegment);
            };

            //client request
            const segmentReq = () => {
                if (mp4frag.segment) {
                    socket.emit('segment', mp4frag.segment);
                } else {
                    mp4frag.once('segment', onSegment);
                }
            };

            //client request
            const pauseReq = () => {//same as stop, for now. will need other logic todo
                mp4frag.removeListener('segment', onSegment);
            };

            //client request
            const resumeReq = () => {//same as segment, for now. will need other logic todo
                mp4frag.on('segment', onSegment);
                //may indicate that we are resuming from paused
            };

            //client request
            const stopReq = () => {
                mp4frag.removeListener('segment', onSegment);
                mp4frag.removeListener('initialized', onInitialized);
                //stop might indicate that we will not request anymore data todo
            };

            //listen to client messages
            socket.on('message', (msg) => {
                console.log(`${namespace} message : ${msg}`);
                switch (msg) {
                    case 'mime' ://client is requesting mime
                        mimeReq();
                        break;
                    case 'initialization' ://client is requesting initialization segment
                        initializationReq();
                        break;
                    case 'segment' ://client is requesting a SINGLE segment
                        segmentReq();
                        break;
                    case 'segments' ://client is requesting ALL segments
                        segmentsReq();
                        break;
                    case 'pause' :
                        pauseReq();
                        break;
                    case 'resume' :
                        resumeReq();
                        break;
                    case 'stop' ://client requesting to stop receiving segments
                        stopReq();
                        break;
                }
            });

            socket.on('disconnect', () => {
                stopReq();
                console.log(`A user disconnected from namespace "${namespace}"`);
            });*/

        });
};