// jshint esversion: 6, globalstrict: true, strict: true, bitwise: true, browser: true, devel: true
/*global MediaSource*/
/*global URL*/
/*global io*/
'use strict';

class VideoPlayer {
    constructor(options, callback) {
        if (typeof callback === 'function' && callback.length === 2) {
            this._callback = callback;
        } else {
            this._callback = (err, msg) => {
                if (err) {
                    console.error(`VideoPlayer Error: ${err} Namespace: ${this._namespace}`);
                    return;
                }
                console.log(`VideoPlayer Message: ${msg} Namespace: ${this._namespace}`);
            };
        }
        if (!options.video || !(options.video instanceof HTMLVideoElement)) {
            this._callback('"options.video" is not a video element');
            return;
        }
        if (!options.namespace) {
            this._callback('missing "options.namespace"');
            return;
        }
        if (!options.io || !options.io.hasOwnProperty('Socket')) {
            this._callback('"options.io is not an instance of socket.io');
            return;
        }
        this._video = options.video;
        if (options.controls) {
            const stb = options.controls.indexOf('startstop') !== -1;
            const fub = options.controls.indexOf('fullscreen') !== -1;
            const snb = options.controls.indexOf('snapshot') !== -1;
            const cyb = options.controls.indexOf('cycle') !== -1;
            //todo: mute and volume buttons will be determined automatically based on codec string
            if (stb || fub || snb || cyb) {
                this._container = document.createElement('div');
                this._container.className = 'mse-container';
                this._video.parentNode.replaceChild(this._container, this._video);
                this._video.className = 'mse-video';
                this._video.controls = false;
                this._video.removeAttribute('controls');
                this._container.appendChild(this._video);
                this._controls = document.createElement('div');
                this._controls.className = 'mse-controls';
                this._container.appendChild(this._controls);
                if (stb) {
                    this._startstop = document.createElement('button');
                    this._startstop.className = 'mse-start';
                    this._startstop.addEventListener('click', (event) => {
                        this.togglePlay();
                    });
                    this._controls.appendChild(this._startstop);
                }
                if (fub) {
                    this._fullscreen = document.createElement('button');
                    this._fullscreen.className = 'mse-fullscreen';
                    this._fullscreen.addEventListener('click', (event) => {
                        if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                            if (this._container.requestFullscreen) {
                                this._container.requestFullscreen();
                            } else if (this._container.msRequestFullscreen) {
                                this._container.msRequestFullscreen();
                            } else if (this._container.mozRequestFullScreen) {
                                this._container.mozRequestFullScreen();
                            } else if (this._container.webkitRequestFullscreen) {
                                this._container.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
                            }
                        } else {
                            if (document.exitFullscreen) {
                                document.exitFullscreen();
                            } else if (document.msExitFullscreen) {
                                document.msExitFullscreen();
                            } else if (document.mozCancelFullScreen) {
                                document.mozCancelFullScreen();
                            } else if (document.webkitExitFullscreen) {
                                document.webkitExitFullscreen();
                            }
                        }
                    });
                    this._controls.appendChild(this._fullscreen);
                }
                if (snb) {
                    this._snapshot = document.createElement('button');
                    this._snapshot.className = 'mse-snapshot';
                    this._snapshot.addEventListener('click', (event) => {
                        if (this._video.readyState < 2) {
                            this._callback(null, `readyState: ${this._video.readyState} < 2`);
                            return;
                        }
                        //safari bug, cannot use video as source for canvas drawImage when it is being used as media source extension (only works when using regular m3u8 playlist)
                        //will hide icon until creating a server side response to deliver a snapshot
                        const canvas = document.createElement("canvas");
                        //this._container.appendChild(canvas);
                        canvas.width = this._video.videoWidth;
                        canvas.height = this._video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(this._video, 0, 0, canvas.width, canvas.height);
                        const href = canvas.toDataURL('image/jpeg', 1.0);
                        const link = document.createElement('a');
                        link.href = href;
                        const date = new Date().getTime();
                        link.download = `${this._namespace}-${new Date().getTime()}-snapshot.jpeg`;
                        //link must be added so that link.click() will work on firefox
                        this._container.appendChild(link);
                        link.click();
                        this._container.removeChild(link);
                    });
                    this._controls.appendChild(this._snapshot);
                }
                if (cyb) {
                    this._cycle = document.createElement('button');
                    this._cycle.className = 'mse-cycle';
                    this._cycling = false;
                    if (options.cycleTime) {
                        const int = parseInt(options.cycleTime);
                        if (int < 2) {
                            this._cycleTime = 2000;
                        } else if (int > 10) {
                            this._cycleTime = 10000;
                        } else {
                            this._cycleTime = int * 1000;
                        }
                    } else {
                        this._cycleTime = 2000;
                    }
                    this._cycle.addEventListener('click', (event) => {
                        if (!this._cycling) {
                            this._namespaces = [];
                            this._cycleIndex = 0;
                            const videoPlayers = window.videoPlayers;
                            for(let i = 0; i < videoPlayers.length; i++) {
                                this._namespaces.push(videoPlayers[i].namespace);
                                if (videoPlayers[i] !== this) {
                                    videoPlayers[i].disabled = true;
                                } else {
                                    this._cycleIndex = i;
                                }
                            }
                            if (this._namespaces.length < 2) {
                                this._callback(null, 'unable to cycle because namespaces < 2');
                                delete this._namespaces;
                                delete this._cycleIndex;
                                return;
                            }
                            if (!this._playing) {
                                this.start();
                            }
                            if (this._startstop) {
                                this._startstop.classList.add('cycling');
                            }
                            this._cycle.classList.add('animated');
                            this._cycleInterval = setInterval(()=> {
                                this._cycleIndex++;
                                if (this._cycleIndex === this._namespaces.length) {
                                    this._cycleIndex = 0;
                                }
                                this.start(this._namespaces[this._cycleIndex]);
                            }, this._cycleTime);
                            this._cycling = true;
                        } else {
                            clearInterval(this._cycleInterval);
                            this._cycle.classList.remove('animated');
                            if (this._startstop) {
                                this._startstop.classList.remove('cycling');
                            }
                            this.start();
                            const videoPlayers = window.videoPlayers;
                            for(let i = 0; i < videoPlayers.length; i++) {
                                if (videoPlayers[i] !== this) {
                                    videoPlayers[i].disabled = false;
                                }
                            }
                            delete this._namespaces;
                            delete this._cycleInterval;
                            this._cycling = false;
                        }
                    });
                    this._controls.appendChild(this._cycle);
                }
            }
        }
        this._namespace = options.namespace;
        this._io = options.io;
        if (!window.videoPlayers) {
            window.videoPlayers = [];
        }
        window.videoPlayers.push(this);
        return this;
    }

    get namespace() {
        return this._namespace || null;
    }

    set namespace(value) {
        this._namespace = value;
    }

    /** @return {boolean}*/
    get disabled() {
        if (!this._container) {
            return false;
        }
        return this._container.classList.contains('disabled');
    }

    /** @param {boolean} bool*/
    set disabled(bool) {
        if (!this._container) {
            return;
        }
        if (bool === true) {
            if (this._container.classList.contains('disabled')) {
                return;
            }
            this._container.classList.add('disabled');
            this.stop();
        } else {
            if (!this._container.classList.contains('disabled')) {
                return;
            }
            this._container.classList.remove('disabled');
            this.start();
        }
    }

    ////////////////////////// public methods ////////////////////////////

    mediaInfo() {
        let str = `******************\n`;
        str += `namespace : ${this._namespace}\n`;
        if (this._video) {
            str += `video.paused : ${this._video.paused}\nvideo.currentTime : ${this._video.currentTime}\nvideo.src : ${this._video.src}\n`;
            if (this._sourceBuffer.buffered.length) {
                str += `buffered.length : ${this._sourceBuffer.buffered.length}\nbuffered.end(0) : ${this._sourceBuffer.buffered.end(0)}\nbuffered.start(0) : ${this._sourceBuffer.buffered.start(0)}\nbuffered size : ${this._sourceBuffer.buffered.end(0) - this._sourceBuffer.buffered.start(0)}\nlag : ${this._sourceBuffer.buffered.end(0) - this._video.currentTime}\n`;
            }
        }
        str += `******************\n`;
        console.info(str);
    }
    
    togglePlay() {
        if (this._playing === true) {
            this.stop();
        } else {
            this.start();
        }
        return this;
    }

    start(namespace) {
        if (!namespace) {
            namespace = this._namespace;
        }
        //todo maybe pass namespace as parameter to start(namespace) to accommodate cycling feature
        if (this._playing === true) {
            this.stop();
        }
        if (this._startstop) {
            this._startstop.classList.add('mse-stop');
            this._startstop.classList.remove('mse-start');
            this._startstop.disabled = true;
        }
        this._playing = true;
        this._socket = this._io(`${location.origin}/${namespace}`, {transports: ['websocket'], forceNew: false});
        this._addSocketEvents();
        if (this._startstop) {
            this._startstop.disabled = false;
        }
        return this;
    }

    stop() {
        if (this._startstop) {
            this._startstop.classList.add('mse-start');
            this._startstop.classList.remove('mse-stop');
            this._startstop.disabled = true;
        }
        this._playing = false;
        if (this._video) {
            this._removeVideoEvents();
            this._video.pause();
            this._video.removeAttribute('src');
            //this._video.src = '';//todo: not sure if NOT removing this will cause memory leak
            this._video.load();
        }
        if (this._socket) {
            this._removeSocketEvents();
            if (this._socket.connected) {
                this._socket.disconnect();
            }
            delete this._socket;
        }
        if (this._mediaSource) {
            this._removeMediaSourceEvents();
            if (this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length) {
                this._mediaSource.removeSourceBuffer(this._sourceBuffer);
            }
            delete this._mediaSource;
        }
        if (this._sourceBuffer) {
            this._removeSourceBufferEvents();
            if (this._sourceBuffer.updating) {
                this._sourceBuffer.abort();
            }
            delete this._sourceBuffer;
        }
        if (this._startstop) {
            this._startstop.disabled = false;
        }
        return this;
    }

    destroy() {
        //todo: possibly strip control buttons and other layers added around video player
        return this;
    }

    ///////////////////// video element events /////////////////////////

    _onVideoError(event) {
        this._callback(`video error ${event.type}`);
    }
    
    _onVideoLoadedData(event) {
        this._callback(null, `video loaded data ${event.type}`);
        if ('Promise' in window) {
            this._video.play()
                .then(() => {
                    //this._callback(null, 'play promise fulfilled');
                    //todo remove "click to play" poster
                })
                .catch((error) => {
                    this._callback(error);
                    //todo add "click to play" poster
                });
        } else {
            this._video.play();
        }
    }

    _addVideoEvents() {
        if (!this._video) {
            return;
        }
        this.onVideoError = this._onVideoError.bind(this);
        this._video.addEventListener('error', this.onVideoError, {capture: true, passive: true, once: true});
        this.onVideoLoadedData = this._onVideoLoadedData.bind(this);
        this._video.addEventListener('loadeddata', this.onVideoLoadedData, {capture: true, passive: true, once: true});
        this._callback(null, 'added video events');
    }

    _removeVideoEvents() {
        if (!this._video) {
            return;
        }
        this._video.removeEventListener('error', this.onVideoError, {capture: true, passive: true, once: true});
        delete this.onVideoError;
        this._video.removeEventListener('loadeddata', this.onVideoLoadedData, {capture: true, passive: true, once: true});
        delete this.onVideoLoadedData;
        this._callback(null, 'removed video events');
    }

    ///////////////////// media source events ///////////////////////////

    _onMediaSourceClose(event) {
        this._callback(null, `media source close ${event.type}`);
    }

    _onMediaSourceOpen(event) {
        URL.revokeObjectURL(this._video.src);
        this._mediaSource.duration = Number.POSITIVE_INFINITY;
        this._sourceBuffer = this._mediaSource.addSourceBuffer(this._mime);
        //this._sourceBuffer.mode = 'sequence'; chrome was complaining about timestamps when set to sequence
        this._sourceBuffer.mode = 'segments';
        this._addSourceBufferEvents();
        this._sourceBuffer.appendBuffer(this._init);
        //this._video.setAttribute('poster', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE2MCIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+cmVxdWVzdGluZyBtZWRpYSBzZWdtZW50czwvdGV4dD48L2c+PC9zdmc+');
        this.onSegment = this._onSegment.bind(this);
        this._socket.addEventListener('segment', this.onSegment, {capture: true, passive: true, once: false});
        this._socket.send('segments');
        //this._video.muted = true;
    }

    _addMediaSourceEvents() {
        if (!this._mediaSource) {
            return;
        }
        this.onMediaSourceClose = this._onMediaSourceClose.bind(this);
        this._mediaSource.addEventListener('sourceclose', this.onMediaSourceClose, {capture: true, passive: true, once: true});
        this.onMediaSourceOpen = this._onMediaSourceOpen.bind(this);
        this._mediaSource.addEventListener('sourceopen', this.onMediaSourceOpen, {capture: true, passive: true, once: true});
    }

    _removeMediaSourceEvents() {
        if (!this._mediaSource) {
            return;
        }
        this._mediaSource.removeEventListener('sourceclose', this.onMediaSourceClose, {capture: true, passive: true, once: true});
        delete this.onMediaSourceClose;
        this._mediaSource.removeEventListener('sourceopen', this.onMediaSourceOpen, {capture: true, passive: true, once: true});
        delete this.onMediaSourceOpen;
    }

    ///////////////////// source buffer events /////////////////////////
    
    _onSourceBufferError(event) {
        this._callback(`sourceBufferError ${event.type}`);
    }

    _onSourceBufferUpdateEnd(event) {
        //cant do anything to sourceBuffer if it is updating
        if (this._sourceBuffer.updating) {
            return;
        }
        //if has last segment pending, append it
        if (this._lastSegment) {
            //this._callback(null, 'using this._lastSegment');
            this._sourceBuffer.appendBuffer(this._lastSegment);
            delete this._lastSegment;
            return;
        }
        //check if buffered media exists
        if (!this._sourceBuffer.buffered.length) {
            return;
        }
        const currentTime = this._video.currentTime;
        const start = this._sourceBuffer.buffered.start(0);
        const end = this._sourceBuffer.buffered.end(0);
        const past = currentTime - start;
        //todo play with numbers and make dynamic or user configurable
        if (past > 20 && currentTime < end) {
            this._sourceBuffer.remove(start, currentTime - 4);
        }
    }

    _addSourceBufferEvents() {
        if(!this._sourceBuffer) {
            return;
        }
        this.onSourceBufferError = this._onSourceBufferError.bind(this);
        this._sourceBuffer.addEventListener('error', this.onSourceBufferError, {capture: true, passive: true, once: true});
        this.onSourceBufferUpdateEnd = this._onSourceBufferUpdateEnd.bind(this);
        this._sourceBuffer.addEventListener('updateend', this.onSourceBufferUpdateEnd, {capture: true, passive: true, once: false});
    }

    _removeSourceBufferEvents() {
        if(!this._sourceBuffer) {
            return;
        }
        this._sourceBuffer.removeEventListener('error', this.onSourceBufferError, {capture: true, passive: true, once: true});
        delete this.onSourceBufferError;
        this._sourceBuffer.removeEventListener('updateend', this.onSourceBufferUpdateEnd, {capture: true, passive: true, once: false});
        delete this.onSourceBufferUpdateEnd;
    }

    ///////////////////// socket.io events //////////////////////////////
    
    _onSocketConnect(event) {
        //this._callback(null, 'socket connect');
        //this._video.setAttribute('poster', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE5NiIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+cmVxdWVzdGluZyBtaW1lIHR5cGU8L3RleHQ+PC9nPjwvc3ZnPg==');
        this.onMime = this._onMime.bind(this);
        this._socket.addEventListener('mime', this.onMime, {capture: true, passive: true, once: true});
        this._socket.send('mime');
    }
    
    _onSocketDisconnect(event) {
        this._callback(null, `socket disconnect "${event}"`);
        this.stop();
    }
    
    _onSocketError(event) {
        this._callback(`socket error "${event}"`);
        this.stop();
    }

    _onMime(data) {
        this._mime = data;
        if (!MediaSource.isTypeSupported(this._mime)) {
            this._video.setAttribute('poster', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE3NyIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+bWltZSB0eXBlIG5vdCBzdXBwb3J0ZWQ8L3RleHQ+PC9nPjwvc3ZnPg==');
            this._callback(`unsupported mime "${this._mime}"`);
            return;
        }
        //this._video.setAttribute('poster', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE4NiIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+cmVxdWVzdGluZyBpbml0IHNlZ21lbnQ8L3RleHQ+PC9nPjwvc3ZnPg==');
        this.onInit = this._onInit.bind(this);
        this._socket.addEventListener('initialization', this.onInit, {capture: true, passive: true, once: true});
        this._socket.send('initialization');
    }

    _onInit(data) {
        this._init = data;
        this._mediaSource = new MediaSource();
        this._addMediaSourceEvents();
        this._addVideoEvents();
        this._video.src = URL.createObjectURL(this._mediaSource);
    }

    _onSegment(data) {
        if (this._sourceBuffer.buffered.length) {
            const lag = this._sourceBuffer.buffered.end(0) - this._video.currentTime;
            if (lag > 0.5) {
                this._video.currentTime = this._sourceBuffer.buffered.end(0) - 0.5;
            }
        }
        if (this._sourceBuffer.updating) {
            this._lastSegment = data;
        } else {
            delete this._lastSegment;
            this._sourceBuffer.appendBuffer(data);
        }
    }

    _addSocketEvents() {
        if (!this._socket) {
            return;
        }
        this.onSocketConnect = this._onSocketConnect.bind(this);
        this._socket.addEventListener('connect', this.onSocketConnect, {capture: true, passive: true, once: true});
        this.onSocketDisconnect = this._onSocketDisconnect.bind(this);
        this._socket.addEventListener('disconnect', this.onSocketDisconnect, {capture: true, passive: true, once: true});
        this.onSocketError = this._onSocketError.bind(this);
        this._socket.addEventListener('error', this.onSocketError, {capture: true, passive: true, once: true});
    }

    _removeSocketEvents() {
        if (!this._socket) {
            return;
        }
        this._socket.removeEventListener('connect', this.onSocketConnect, {capture: true, passive: true, once: true});
        delete this.onSocketConnect;
        this._socket.removeEventListener('disconnect', this.onSocketDisconnect, {capture: true, passive: true, once: true});
        delete this.onSocketDisconnect;
        this._socket.removeEventListener('error', this.onSocketError, {capture: true, passive: true, once: true});
        delete this.onSocketError;
        this._socket.removeEventListener('mime', this.onMime, {capture: true, passive: true, once: true});
        delete this.onMime;
        this._socket.removeEventListener('initialization', this.onInit, {capture: true, passive: true, once: true});
        delete this.onInit;
        this._socket.removeEventListener('segment', this.onSegment, {capture: true, passive: true, once: false});
        delete this.onSegment;
    }

}

(function mse(window) {

    if (!('io' in window)) {
        throw new Error('socket.io was not found');
        //return;
    }

    //get all video elements on page
    const videos = document.getElementsByTagName('video');

    //array to keep reference to newly created VideoPlayers, maybe could be a keyed object
    //const videoPlayers = [];

    for (let i = 0; i < videos.length; i++) {
        const video = videos[i];
        //only grab video elements that deliberately have data-namespace attribute
        if (video.dataset.namespace) {
            const videoPlayer = new VideoPlayer({video: video, io: io, namespace: video.dataset.namespace, controls: video.dataset.controls});
            if (video.autoplay) {
                videoPlayer.start();
            }
            //videoPlayers.push(videoPlayer);
        }
    }

    //make videoPlayers accessible
    //window.videoPlayers = videoPlayers;

})(window);

//todo steps for creation of video player
//script is loaded at footer so that it can run after html is ready on page
//verify that socket.io is defined in window
//iterate each video element that has custom data-namespace attributes that we need
//initiate socket to get information from server
//first request codec string to test against browser and then feed first into source
//then request init-segment to feed
//then request media segments until we run into pause, stop, close, error, buffer not ready, etc
//change poster on video element based on current status, error, not ready, etc