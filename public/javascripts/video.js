'use strict';

(function init() {
  /* -------------------- hls.js -------------------- */

  var hlsjsVideo = document.getElementById('hlsjsVideo');
  if (window.Hls.isSupported()) {
    var hls = new window.Hls({
      liveDurationInfinity: true,
      manifestLoadingTimeOut: 1000,
      manifestLoadingMaxRetry: 30,
      manifestLoadingRetryDelay: 500
    });
    hls.on(window.Hls.Events.ERROR, function (event, data) {
      console.log('hls error', data);
      console.log(data.type);
      console.log(data.details);
      // if (data.type === 'networkError') {
      // hlsjsVideo.parentElement.innerHTML = '<p>hls.js network error</p>';
      // }
    });
    hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
      hlsjsVideo.play();
    });
    hls.attachMedia(hlsjsVideo);
    hls.loadSource('/hls/test.m3u8');
  } else {
    hlsjsVideo.parentElement.innerHTML = '<p>hls.js not supported</p>';
  }

  /* -------------------- jpeg socket.io -------------------- */

  var jpegImg = document.getElementById('jpegImg');
  var jpegSocket = window.io.connect(window.location.origin + '/jpeg', {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  });
  jpegSocket.on('jpeg', function (data) {
    var arrayBufferView = new Uint8Array(data);
    var blob = new window.Blob([arrayBufferView], { type: 'image/jpeg' });
    var urlCreator = window.URL || window.webkitURL;
    jpegImg.src = urlCreator.createObjectURL(blob);
  });

  /* -------------------- progress -------------------- */

  var progress = document.getElementById('progress');
  var progressSocket = window.io.connect(window.location.origin + '/progress', {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  });
  progressSocket.on('progress', function (data) {
    progress.innerText = data;
  });

  /* -------------------- m3u8 -------------------- */

  var m3u8 = document.getElementById('m3u8');
  var m3u8Socket = window.io.connect(window.location.origin + '/m3u8', {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  });
  m3u8Socket.on('m3u8', function (data) {
    m3u8.innerText = data;
  });

  /* -------------------- mime -------------------- */

  var mime = document.getElementById('mime');
  var mimeSocket = window.io.connect(window.location.origin + '/mse', {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  });
  mimeSocket.on('mime', function (data) {
    var type = data.toLowerCase();
    var message = type;
    if ('MediaSource' in window) {
      message += '\nMediaSource.isTypeSupported = ' + window.MediaSource.isTypeSupported(type);
    } else {
      message += '\nMediaSource not supported by browser';
    }
    var vid = document.createElement('video');
    message += '\nHTMLMediaElement.canPlayType = ' + vid.canPlayType(type);
    mime.innerText = message;
    mimeSocket.disconnect();
  });
  mimeSocket.emit('message', 'mime');

  /* -------------------- stderr -------------------- */

  var stderrArr = [];
  var stderr = document.getElementById('stderr');
  var stderrSocket = window.io.connect(window.location.origin + '/stderr', {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  });
  stderrSocket.on('stderr', function (data) {
    stderrArr.push(data);
    while (stderrArr.length > 200) {
      stderrArr.shift();
    }
    stderr.innerText = stderrArr.join('\n');
  });

  /* -------------------- progressive mp4 -------------------- */

  var mp4Video = document.getElementById('mp4Video');
  var mp4VideoLoads = 0;
  var loadMp4Video = function loadMp4Video() {
    mp4Video.src = '/mp4/test.mp4?t=' + new Date().toLocaleTimeString().split(' ').join('_');
    mp4Video.load();
    mp4VideoLoads++;
  };
  mp4Video.addEventListener('canplay', function (evt) {
    mp4VideoLoads = 0;
    mp4Video.play();
  });
  mp4Video.addEventListener('error', function (evt) {
    if (mp4VideoLoads > 30) {
      mp4Video.parentElement.innerHTML = '<p>progressive mp4 playback error</p>';
      return;
    }
    setTimeout(loadMp4Video, 500);
  });
  if (mp4Video.canPlayType('video/mp4')) {
    loadMp4Video();
  } else {
    mp4Video.parentElement.innerHTML = '<p>progressive mp4 not supported</p>';
  }

  /* -------------------- native hls -------------------- */

  var hlsVideo = document.getElementById('hlsVideo');
  var hlsVideoLoads = 0;
  var loadHlsVideo = function loadHlsVideo() {
    hlsVideo.src = '/hls/test.m3u8?t=' + new Date().toLocaleTimeString().split(' ').join('_');
    hlsVideo.load();
    hlsVideoLoads++;
  };
  hlsVideo.addEventListener('canplay', function (evt) {
    // console.log('can play');
    hlsVideoLoads = 0;
    hlsVideo.play();
  });
  hlsVideo.addEventListener('error', function (evt) {
    if (hlsVideoLoads > 30) {
      hlsVideo.parentElement.innerHTML = '<p>native hls playback error</p>';
      return;
    }
    setTimeout(loadHlsVideo, 500);
  });
  if (hlsVideo.canPlayType('application/vnd.apple.mpegurl')) {
    loadHlsVideo();
  } else {
    hlsVideo.parentElement.innerHTML = '<p>native hls not supported</p>';
  }

  /* -------------------- mjpeg -------------------- */

  var mjpegImg = document.getElementById('mjpegImg');
  mjpegImg.src = '/mjpeg/test.mjpg';
  mjpegImg.addEventListener('error', function (evt) {
    if (mjpegImg && mjpegImg.parentElement) {
      mjpegImg.parentElement.innerHTML = '<p>mjpeg playback error</p>';
    }
  });

  /* -------------------- mse socket.io -------------------- */

  var msePlayer = new window.VideoPlayer({
    video: document.getElementById('mseVideo'),
    io: window.io,
    namespace: 'mse',
    controls: ''
  }, function (err, msg) {
    if (err) {
      console.error('mse', err);
      console.log(document.getElementById('mseVideo').error);
    }
  });
  msePlayer.start();

  /* -------------------- cleanup -------------------- */

  window.addEventListener('beforeunload', function (evt) {
    stderrSocket.disconnect();
    progressSocket.disconnect();
    m3u8Socket.disconnect();
    mimeSocket.disconnect();
    jpegSocket.disconnect();
    mjpegImg.src = '';
    mp4Video.pause();
    hlsVideo.pause();
    hlsjsVideo.pause();
    msePlayer.stop();
  });
})();

//# sourceMappingURL=video.js.map