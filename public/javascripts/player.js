// jshint browser: true
'use strict'

/*
lag 2 = threshold for current play time behind available buffer end time to trigger play head move, will split the measured lag difference / 2
past 20 = duration of buffered video past current play time to trigger buffer removal
keep 5 = duration of buffer to keep past current play time when removing old buffer
- too low of allowable lag will cause unstable playback
- too high of allowable lag may cause realtime latency
- removing too much past buffer can cause unstable playback
- removing too little will increase memory use in browser for storing extra buffer
 */

var _createClass = (function () { function defineProperties (target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor) } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor } }())

function _classCallCheck (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function') } }

var config = { lag: 2.0, past: 20, keep: 5 }

var VideoPlayer = (function () {
  function VideoPlayer (options, callback) {
    var _this = this

    _classCallCheck(this, VideoPlayer)

    if (typeof callback === 'function' && callback.length === 2) {
      this._callback = callback
    } else {
      this._callback = function (err, msg) {
        if (err) {
          console.error('VideoPlayer Error: ' + err + ' Namespace: ' + _this._namespace)
          return
        }
        console.log('VideoPlayer Message: ' + msg + ' Namespace: ' + _this._namespace)
      }
    }
    if (!options.video || !(options.video instanceof window.HTMLVideoElement)) {
      this._callback('"options.video" is not a video element')
      return
    }
    if (!options.namespace) {
      this._callback('missing "options.namespace"')
      return
    }
    if (!options.io || !options.io.hasOwnProperty('Socket')) {
      this._callback('"options.io is not an instance of socket.io')
      return
    }
    this._video = options.video
    if (options.controls) {
      var stb = options.controls.indexOf('startstop') !== -1
      var fub = options.controls.indexOf('fullscreen') !== -1
      var snb = options.controls.indexOf('snapshot') !== -1
      var cyb = options.controls.indexOf('cycle') !== -1
      // todo: mute and volume buttons will be determined automatically based on codec string
      if (stb || fub || snb || cyb) {
        this._container = document.createElement('div')
        this._container.className = 'mse-container'
        this._video.parentNode.replaceChild(this._container, this._video)
        this._video.className = 'mse-video'
        this._video.controls = false
        this._video.removeAttribute('controls')
        this._container.appendChild(this._video)
        this._controls = document.createElement('div')
        this._controls.className = 'mse-controls'
        this._container.appendChild(this._controls)
        if (stb) {
          this._startstop = document.createElement('button')
          this._startstop.className = 'mse-start'
          this._startstop.addEventListener('click', function () /* event */{
            _this.togglePlay()
          })
          this._controls.appendChild(this._startstop)
        }
        if (fub) {
          this._fullscreen = document.createElement('button')
          this._fullscreen.className = 'mse-fullscreen'
          this._fullscreen.addEventListener('click', function () /* event */{
            if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
              if (_this._container.requestFullscreen) {
                _this._container.requestFullscreen()
              } else if (_this._container.msRequestFullscreen) {
                _this._container.msRequestFullscreen()
              } else if (_this._container.mozRequestFullScreen) {
                _this._container.mozRequestFullScreen()
              } else if (_this._container.webkitRequestFullscreen) {
                _this._container.webkitRequestFullscreen(window.Element.ALLOW_KEYBOARD_INPUT)
              }
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen()
              } else if (document.msExitFullscreen) {
                document.msExitFullscreen()
              } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen()
              } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen()
              }
            }
          })
          this._controls.appendChild(this._fullscreen)
        }
        if (snb) {
          this._snapshot = document.createElement('button')
          this._snapshot.className = 'mse-snapshot'
          this._snapshot.addEventListener('click', function () /* event */{
            if (_this._video.readyState < 2) {
              _this._callback(null, 'readyState: ' + _this._video.readyState + ' < 2')
              return
            }
            // safari bug, cannot use video as source for canvas drawImage when it is being used as media source extension (only works when using regular m3u8 playlist)
            // will hide icon until creating a server side response to deliver a snapshot
            var canvas = document.createElement('canvas')
            // this._container.appendChild(canvas);
            canvas.width = _this._video.videoWidth
            canvas.height = _this._video.videoHeight
            var ctx = canvas.getContext('2d')
            ctx.drawImage(_this._video, 0, 0, canvas.width, canvas.height)
            var href = canvas.toDataURL('image/jpeg', 1.0)
            var link = document.createElement('a')
            link.href = href
            var date = new Date().getTime()
            link.download = _this._namespace + '-' + date + '-snapshot.jpeg'
            // link must be added so that link.click() will work on firefox
            _this._container.appendChild(link)
            link.click()
            _this._container.removeChild(link)
          })
          this._controls.appendChild(this._snapshot)
        }
        if (cyb) {
          this._cycle = document.createElement('button')
          this._cycle.className = 'mse-cycle'
          this._cycling = false
          if (options.cycleTime) {
            var int = parseInt(options.cycleTime)
            if (int < 2) {
              this._cycleTime = 2000
            } else if (int > 10) {
              this._cycleTime = 10000
            } else {
              this._cycleTime = int * 1000
            }
          } else {
            this._cycleTime = 2000
          }
          this._cycle.addEventListener('click', function () /* event */{
            if (!_this._cycling) {
              _this._namespaces = []
              _this._cycleIndex = 0
              var videoPlayers = window.videoPlayers
              for (var i = 0; i < videoPlayers.length; i++) {
                _this._namespaces.push(videoPlayers[i].namespace)
                if (videoPlayers[i] !== _this) {
                  videoPlayers[i].disabled = true
                } else {
                  _this._cycleIndex = i
                }
              }
              if (_this._namespaces.length < 2) {
                _this._callback(null, 'unable to cycle because namespaces < 2')
                delete _this._namespaces
                delete _this._cycleIndex
                return
              }
              if (!_this._playing) {
                _this.start()
              }
              if (_this._startstop) {
                _this._startstop.classList.add('cycling')
              }
              _this._cycle.classList.add('animated')
              _this._cycleInterval = setInterval(function () {
                _this._cycleIndex++
                if (_this._cycleIndex === _this._namespaces.length) {
                  _this._cycleIndex = 0
                }
                _this.start(_this._namespaces[_this._cycleIndex])
              }, _this._cycleTime)
              _this._cycling = true
            } else {
              clearInterval(_this._cycleInterval)
              _this._cycle.classList.remove('animated')
              if (_this._startstop) {
                _this._startstop.classList.remove('cycling')
              }
              _this.start()
              var _videoPlayers = window.videoPlayers
              for (var _i = 0; _i < _videoPlayers.length; _i++) {
                if (_videoPlayers[_i] !== _this) {
                  _videoPlayers[_i].disabled = false
                }
              }
              delete _this._namespaces
              delete _this._cycleInterval
              _this._cycling = false
            }
          })
          this._controls.appendChild(this._cycle)
        }
      }
    }
    this._namespace = options.namespace
    this._io = options.io
    if (!window.videoPlayers) {
      window.videoPlayers = []
    }
    window.videoPlayers.push(this)
    return this
  }

  _createClass(VideoPlayer, [{
    key: 'mediaInfo',

    /* ----------------------- public methods ----------------------- */

    value: function mediaInfo () {
      var str = '******************\n'
      str += 'namespace : ' + this._namespace + '\n'
      if (this._video) {
        str += 'video.paused : ' + this._video.paused + '\nvideo.currentTime : ' + this._video.currentTime + '\nvideo.src : ' + this._video.src + '\n'
        if (this._sourceBuffer.buffered.length) {
          str += 'buffered.length : ' + this._sourceBuffer.buffered.length + '\nbuffered.end(0) : ' + this._sourceBuffer.buffered.end(0) + '\nbuffered.start(0) : ' + this._sourceBuffer.buffered.start(0) + '\nbuffered size : ' + (this._sourceBuffer.buffered.end(0) - this._sourceBuffer.buffered.start(0)) + '\nlag : ' + (this._sourceBuffer.buffered.end(0) - this._video.currentTime) + '\n'
        }
      }
      str += '******************\n'
      console.info(str)
    }
  }, {
    key: 'togglePlay',
    value: function togglePlay () {
      if (this._playing === true) {
        this.stop()
      } else {
        this.start()
      }
      return this
    }
  }, {
    key: 'start',
    value: function start (namespace) {
      if (!namespace) {
        namespace = this._namespace
      }
      // todo maybe pass namespace as parameter to start(namespace) to accommodate cycling feature
      if (this._playing === true) {
        this.stop()
      }
      if (this._startstop) {
        this._startstop.classList.add('mse-stop')
        this._startstop.classList.remove('mse-start')
        this._startstop.disabled = true
      }
      this._playing = true
      this._socket = this._io(window.location.origin + '/' + namespace, { transports: ['websocket'], forceNew: false })
      this._addSocketEvents()
      if (this._startstop) {
        this._startstop.disabled = false
      }
      return this
    }
  }, {
    key: 'stop',
    value: function stop () {
      if (this._startstop) {
        this._startstop.classList.add('mse-start')
        this._startstop.classList.remove('mse-stop')
        this._startstop.disabled = true
      }
      this._playing = false
      if (this._video) {
        this._removeVideoEvents()
        this._video.pause()
        this._video.removeAttribute('src')
        // this._video.src = '';//todo: not sure if NOT removing this will cause memory leak
        this._video.load()
      }
      if (this._socket) {
        this._removeSocketEvents()
        if (this._socket.connected) {
          this._socket.disconnect()
        }
        delete this._socket
      }
      if (this._mediaSource) {
        this._removeMediaSourceEvents()
        if (this._mediaSource.sourceBuffers && this._mediaSource.sourceBuffers.length) {
          this._mediaSource.removeSourceBuffer(this._sourceBuffer)
        }
        delete this._mediaSource
      }
      if (this._sourceBuffer) {
        this._removeSourceBufferEvents()
        if (this._sourceBuffer.updating) {
          this._sourceBuffer.abort()
        }
        delete this._sourceBuffer
      }
      if (this._startstop) {
        this._startstop.disabled = false
      }
      return this
    }
  }, {
    key: 'destroy',
    value: function destroy () {
      // todo: possibly strip control buttons and other layers added around video player
      return this
    }

    /* ----------------------- video element events ----------------------- */

  }, {
    key: '_onVideoError',
    value: function _onVideoError (event) {
      this._callback('video error ' + event.type)
    }
  }, {
    key: '_onVideoLoadedData',
    value: function _onVideoLoadedData (event) {
      var _this2 = this

      this._callback(null, 'video loaded data ' + event.type)
      if ('Promise' in window) {
        this._video.play().then(function () {
          // this._callback(null, 'play promise fulfilled');
          // todo remove "click to play" poster
        }).catch(function (error) {
          _this2._callback(error)
          // todo add "click to play" poster
        })
      } else {
        this._video.play()
      }
    }
  }, {
    key: '_addVideoEvents',
    value: function _addVideoEvents () {
      if (!this._video) {
        return
      }
      this.onVideoError = this._onVideoError.bind(this)
      this._video.addEventListener('error', this.onVideoError, { capture: true, passive: true, once: true })
      this.onVideoLoadedData = this._onVideoLoadedData.bind(this)
      this._video.addEventListener('loadeddata', this.onVideoLoadedData, { capture: true, passive: true, once: true })
      this._callback(null, 'added video events')
    }
  }, {
    key: '_removeVideoEvents',
    value: function _removeVideoEvents () {
      if (!this._video) {
        return
      }
      this._video.removeEventListener('error', this.onVideoError, { capture: true, passive: true, once: true })
      delete this.onVideoError
      this._video.removeEventListener('loadeddata', this.onVideoLoadedData, { capture: true, passive: true, once: true })
      delete this.onVideoLoadedData
      this._callback(null, 'removed video events')
    }

    /* ----------------------- media source events ----------------------- */

  }, {
    key: '_onMediaSourceClose',
    value: function _onMediaSourceClose (event) {
      this._callback(null, 'media source close ' + event.type)
    }
  }, {
    key: '_onMediaSourceOpen',
    value: function _onMediaSourceOpen () /* event */{
      window.URL.revokeObjectURL(this._video.src)
      this._mediaSource.duration = Number.POSITIVE_INFINITY
      this._sourceBuffer = this._mediaSource.addSourceBuffer(this._mime)
      this._sourceBuffer.mode = 'sequence' // chrome was complaining about timestamps when set to sequence
      // this._sourceBuffer.mode = 'segments';
      this._addSourceBufferEvents()
      this._sourceBuffer.appendBuffer(this._init)
      // this._video.setAttribute('poster', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE2MCIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+cmVxdWVzdGluZyBtZWRpYSBzZWdtZW50czwvdGV4dD48L2c+PC9zdmc+');
      this.onSegment = this._onSegment.bind(this)
      this._socket.addEventListener('segment', this.onSegment, { capture: true, passive: true, once: false })
      this._socket.send('segments')
      // this._video.muted = true;
    }
  }, {
    key: '_addMediaSourceEvents',
    value: function _addMediaSourceEvents () {
      if (!this._mediaSource) {
        return
      }
      this.onMediaSourceClose = this._onMediaSourceClose.bind(this)
      this._mediaSource.addEventListener('sourceclose', this.onMediaSourceClose, { capture: true, passive: true, once: true })
      this.onMediaSourceOpen = this._onMediaSourceOpen.bind(this)
      this._mediaSource.addEventListener('sourceopen', this.onMediaSourceOpen, { capture: true, passive: true, once: true })
    }
  }, {
    key: '_removeMediaSourceEvents',
    value: function _removeMediaSourceEvents () {
      if (!this._mediaSource) {
        return
      }
      this._mediaSource.removeEventListener('sourceclose', this.onMediaSourceClose, { capture: true, passive: true, once: true })
      delete this.onMediaSourceClose
      this._mediaSource.removeEventListener('sourceopen', this.onMediaSourceOpen, { capture: true, passive: true, once: true })
      delete this.onMediaSourceOpen
    }

    /* ----------------------- source buffer events ----------------------- */

  }, {
    key: '_onSourceBufferError',
    value: function _onSourceBufferError (event) {
      this._callback('sourceBufferError ' + event.type)
    }
  }, {
    key: '_onSourceBufferUpdateEnd',
    value: function _onSourceBufferUpdateEnd () /* event */{
      // cant do anything to sourceBuffer if it is updating
      if (this._sourceBuffer.updating) {
        return
      }
      // if has last segment pending, append it
      if (this._lastSegment) {
        // this._callback(null, 'using this._lastSegment');
        this._sourceBuffer.appendBuffer(this._lastSegment)
        delete this._lastSegment
        return
      }
      // check if buffered media exists
      if (!this._sourceBuffer.buffered.length) {
        return
      }
      // current time of play position
      var currentTime = this._video.currentTime
      // start time for currently buffered video
      var start = this._sourceBuffer.buffered.start(0)
      // end time for currently buffered video
      var end = this._sourceBuffer.buffered.end(0)
      // duration of currently buffered video behind current play time
      var past = currentTime - start
      // todo play with numbers and make dynamic or user configurable
      if (past > config.past && currentTime < end) {
        this._sourceBuffer.remove(start, currentTime - config.keep) // was 4
      }
    }
  }, {
    key: '_addSourceBufferEvents',
    value: function _addSourceBufferEvents () {
      if (!this._sourceBuffer) {
        return
      }
      this.onSourceBufferError = this._onSourceBufferError.bind(this)
      this._sourceBuffer.addEventListener('error', this.onSourceBufferError, { capture: true, passive: true, once: true })
      this.onSourceBufferUpdateEnd = this._onSourceBufferUpdateEnd.bind(this)
      this._sourceBuffer.addEventListener('updateend', this.onSourceBufferUpdateEnd, { capture: true, passive: true, once: false })
    }
  }, {
    key: '_removeSourceBufferEvents',
    value: function _removeSourceBufferEvents () {
      if (!this._sourceBuffer) {
        return
      }
      this._sourceBuffer.removeEventListener('error', this.onSourceBufferError, { capture: true, passive: true, once: true })
      delete this.onSourceBufferError
      this._sourceBuffer.removeEventListener('updateend', this.onSourceBufferUpdateEnd, { capture: true, passive: true, once: false })
      delete this.onSourceBufferUpdateEnd
    }

    /* ----------------------- socket.io events ----------------------- */

  }, {
    key: '_onSocketConnect',
    value: function _onSocketConnect () /* event */{
      // this._callback(null, 'socket connect');
      // this._video.setAttribute('poster', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE5NiIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+cmVxdWVzdGluZyBtaW1lIHR5cGU8L3RleHQ+PC9nPjwvc3ZnPg==');
      this.onMime = this._onMime.bind(this)
      this._socket.addEventListener('mime', this.onMime, { capture: true, passive: true, once: true })
      this._socket.send('mime')
    }
  }, {
    key: '_onSocketDisconnect',
    value: function _onSocketDisconnect (event) {
      this._callback(null, 'socket disconnect "' + event + '"')
      this.stop()
    }
  }, {
    key: '_onSocketError',
    value: function _onSocketError (event) {
      this._callback('socket error "' + event + '"')
      this.stop()
    }
  }, {
    key: '_onMime',
    value: function _onMime (data) {
      this._mime = data
      if (!window.MediaSource.isTypeSupported(this._mime)) {
        this._video.setAttribute('poster', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE3NyIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+bWltZSB0eXBlIG5vdCBzdXBwb3J0ZWQ8L3RleHQ+PC9nPjwvc3ZnPg==')
        this._callback('unsupported mime "' + this._mime + '"')
        return
      }
      // this._video.setAttribute('poster', 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxnPjxyZWN0IHg9Ii0xIiB5PSItMSIgd2lkdGg9IjY0MiIgaGVpZ2h0PSIzNiIgZmlsbD0ibm9uZSIvPjwvZz48Zz48dGV4dCBmaWxsPSIjMDAwIiBzdHJva2Utd2lkdGg9IjAiIHg9IjE4NiIgeT0iMjYiIGZvbnQtc2l6ZT0iMjYiIGZvbnQtZmFtaWx5PSJIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmIiB0ZXh0LWFuY2hvcj0ic3RhcnQiIHhtbDpzcGFjZT0icHJlc2VydmUiIHN0cm9rZT0iIzAwMCI+cmVxdWVzdGluZyBpbml0IHNlZ21lbnQ8L3RleHQ+PC9nPjwvc3ZnPg==');
      this.onInit = this._onInit.bind(this)
      this._socket.addEventListener('initialization', this.onInit, { capture: true, passive: true, once: true })
      this._socket.send('initialization')
    }
  }, {
    key: '_onInit',
    value: function _onInit (data) {
      this._init = data
      this._mediaSource = new window.MediaSource()
      this._addMediaSourceEvents()
      this._addVideoEvents()
      this._video.src = window.URL.createObjectURL(this._mediaSource)
    }
  }, {
    key: '_onSegment',
    value: function _onSegment (data) {
      if (this._sourceBuffer.buffered.length) {
        var lag = this._sourceBuffer.buffered.end(0) - this._video.currentTime
        if (lag > config.lag) {
          // was 0.5
          // move play head
          this._video.currentTime = this._sourceBuffer.buffered.end(0) - lag / 2 // split the difference between buffer end time and current play time
        }
      }
      if (this._sourceBuffer.updating) {
        this._lastSegment = data
      } else {
        delete this._lastSegment
        this._sourceBuffer.appendBuffer(data)
      }
    }
  }, {
    key: '_addSocketEvents',
    value: function _addSocketEvents () {
      if (!this._socket) {
        return
      }
      this.onSocketConnect = this._onSocketConnect.bind(this)
      this._socket.addEventListener('connect', this.onSocketConnect, { capture: true, passive: true, once: true })
      this.onSocketDisconnect = this._onSocketDisconnect.bind(this)
      this._socket.addEventListener('disconnect', this.onSocketDisconnect, { capture: true, passive: true, once: true })
      this.onSocketError = this._onSocketError.bind(this)
      this._socket.addEventListener('error', this.onSocketError, { capture: true, passive: true, once: true })
    }
  }, {
    key: '_removeSocketEvents',
    value: function _removeSocketEvents () {
      if (!this._socket) {
        return
      }
      this._socket.removeEventListener('connect', this.onSocketConnect, { capture: true, passive: true, once: true })
      delete this.onSocketConnect
      this._socket.removeEventListener('disconnect', this.onSocketDisconnect, { capture: true, passive: true, once: true })
      delete this.onSocketDisconnect
      this._socket.removeEventListener('error', this.onSocketError, { capture: true, passive: true, once: true })
      delete this.onSocketError
      this._socket.removeEventListener('mime', this.onMime, { capture: true, passive: true, once: true })
      delete this.onMime
      this._socket.removeEventListener('initialization', this.onInit, { capture: true, passive: true, once: true })
      delete this.onInit
      this._socket.removeEventListener('segment', this.onSegment, { capture: true, passive: true, once: false })
      delete this.onSegment
    }
  }, {
    key: 'namespace',
    get: function get () {
      return this._namespace || null
    },
    set: function set (value) {
      this._namespace = value
    }

    /** @return {boolean} */

  }, {
    key: 'disabled',
    get: function get () {
      if (!this._container) {
        return false
      }
      return this._container.classList.contains('disabled')
    },
    /** @param {boolean} bool */

    set: function set (bool) {
      if (!this._container) {
        return
      }
      if (bool === true) {
        if (this._container.classList.contains('disabled')) {
          return
        }
        this._container.classList.add('disabled')
        this.stop()
      } else {
        if (!this._container.classList.contains('disabled')) {
          return
        }
        this._container.classList.remove('disabled')
        this.start()
      }
    }
  }])

  return VideoPlayer
}());

(function mse (window) {
  if (!('io' in window)) {
    throw new Error('socket.io was not found')
    // return;
  }

  // get all video elements on page
  var videos = document.getElementsByTagName('video')

  // array to keep reference to newly created VideoPlayers, maybe could be a keyed object
  // const videoPlayers = [];

  for (var i = 0; i < videos.length; i++) {
    var video = videos[i]
    // only grab video elements that deliberately have data-namespace attribute
    if (video.dataset.namespace) {
      var videoPlayer = new VideoPlayer({ video: video, io: window.io, namespace: video.dataset.namespace, controls: video.dataset.controls })
      if (video.autoplay) {
        videoPlayer.start()
      }
      // videoPlayers.push(videoPlayer);
    }
  }

  // make videoPlayers accessible
  // window.videoPlayers = videoPlayers;
})(window)

// todo steps for creation of video player
// script is loaded at footer so that it can run after html is ready on page
// verify that socket.io is defined in window
// iterate each video element that has custom data-namespace attributes that we need
// initiate socket to get information from server
// first request codec string to test against browser and then feed first into source
// then request init-segment to feed
// then request media segments until we run into pause, stop, close, error, buffer not ready, etc
// change poster on video element based on current status, error, not ready, etc

// # sourceMappingURL=player.js.map
