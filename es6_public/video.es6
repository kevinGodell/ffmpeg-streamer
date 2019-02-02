'use strict';

(function init () {
  /* -------------------- hls.js -------------------- */

  const hlsjsVideo = document.getElementById('hlsjsVideo')
  if (window.Hls.isSupported()) {
    const hls = new window.Hls({
      liveDurationInfinity: true,
      manifestLoadingTimeOut: 1000,
      manifestLoadingMaxRetry: 30,
      manifestLoadingRetryDelay: 500
    })
    hls.on(window.Hls.Events.ERROR, (event, data) => {
      console.log('hls error', data)
      console.log(data.type)
      console.log(data.details)
      // if (data.type === 'networkError') {
      // hlsjsVideo.parentElement.innerHTML = '<p>hls.js network error</p>';
      // }
    })
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
      hlsjsVideo.play()
    })
    hls.attachMedia(hlsjsVideo)
    hls.loadSource('/hls/test.m3u8')
  } else {
    hlsjsVideo.parentElement.innerHTML = '<p>hls.js not supported</p>'
  }

  /* -------------------- jpeg socket.io -------------------- */

  const jpegImg = document.getElementById('jpegImg')
  const jpegSocket = window.io.connect(`${window.location.origin}/jpeg`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  })
  jpegSocket.on('jpeg', (data) => {
    const arrayBufferView = new Uint8Array(data)
    const blob = new window.Blob([arrayBufferView], { type: 'image/jpeg' })
    const urlCreator = window.URL || window.webkitURL
    jpegImg.src = urlCreator.createObjectURL(blob)
  })

  /* -------------------- progress -------------------- */

  const progress = document.getElementById('progress')
  const progressSocket = window.io.connect(`${window.location.origin}/progress`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  })
  progressSocket.on('progress', (data) => {
    progress.innerText = data
  })

  /* -------------------- m3u8 -------------------- */

  const m3u8 = document.getElementById('m3u8')
  const m3u8Socket = window.io.connect(`${window.location.origin}/m3u8`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  })
  m3u8Socket.on('m3u8', (data) => {
    m3u8.innerText = data
  })

  /* -------------------- mime -------------------- */

  const mime = document.getElementById('mime')
  const mimeSocket = window.io.connect(`${window.location.origin}/mse`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  })
  mimeSocket.on('mime', (data) => {
    const type = data.toLowerCase()
    let message = type
    if ('MediaSource' in window) {
      message += '\nMediaSource.isTypeSupported = ' + window.MediaSource.isTypeSupported(type)
    } else {
      message += '\nMediaSource not supported by browser'
    }
    const vid = document.createElement('video')
    message += '\nHTMLMediaElement.canPlayType = ' + vid.canPlayType(type)
    mime.innerText = message
    mimeSocket.disconnect()
  })
  mimeSocket.emit('message', 'mime')

  /* -------------------- stderr -------------------- */

  const stderrArr = []
  const stderr = document.getElementById('stderr')
  const stderrSocket = window.io.connect(`${window.location.origin}/stderr`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: true,
    reconnectionDelay: 500
  })
  stderrSocket.on('stderr', (data) => {
    stderrArr.push(data)
    while (stderrArr.length > 200) {
      stderrArr.shift()
    }
    stderr.innerText = stderrArr.join('\n')
  })

  /* -------------------- progressive mp4 -------------------- */

  const mp4Video = document.getElementById('mp4Video')
  let mp4VideoLoads = 0
  const loadMp4Video = () => {
    mp4Video.src = '/mp4/test.mp4?t=' + new Date().toLocaleTimeString().split(' ').join('_')
    mp4Video.load()
    mp4VideoLoads++
  }
  mp4Video.addEventListener('canplay', (evt) => {
    mp4VideoLoads = 0
    mp4Video.play()
  })
  mp4Video.addEventListener('error', (evt) => {
    if (mp4VideoLoads > 30) {
      mp4Video.parentElement.innerHTML = '<p>progressive mp4 playback error</p>'
      return
    }
    setTimeout(loadMp4Video, 500)
  })
  if (mp4Video.canPlayType('video/mp4')) {
    loadMp4Video()
  } else {
    mp4Video.parentElement.innerHTML = '<p>progressive mp4 not supported</p>'
  }

  /* -------------------- native hls -------------------- */

  const hlsVideo = document.getElementById('hlsVideo')
  let hlsVideoLoads = 0
  const loadHlsVideo = () => {
    hlsVideo.src = '/hls/test.m3u8?t=' + new Date().toLocaleTimeString().split(' ').join('_')
    hlsVideo.load()
    hlsVideoLoads++
  }
  hlsVideo.addEventListener('canplay', (evt) => {
    // console.log('can play');
    hlsVideoLoads = 0
    hlsVideo.play()
  })
  hlsVideo.addEventListener('error', (evt) => {
    if (hlsVideoLoads > 30) {
      hlsVideo.parentElement.innerHTML = '<p>native hls playback error</p>'
      return
    }
    setTimeout(loadHlsVideo, 500)
  })
  if (hlsVideo.canPlayType('application/vnd.apple.mpegurl')) {
    loadHlsVideo()
  } else {
    hlsVideo.parentElement.innerHTML = '<p>native hls not supported</p>'
  }

  /* -------------------- mjpeg -------------------- */

  const mjpegImg = document.getElementById('mjpegImg')
  mjpegImg.src = '/mjpeg/test.mjpg'
  mjpegImg.addEventListener('error', (evt) => {
    if (mjpegImg && mjpegImg.parentElement) {
      mjpegImg.parentElement.innerHTML = '<p>mjpeg playback error</p>'
    }
  })

  /* -------------------- mse socket.io -------------------- */

  const msePlayer = new window.VideoPlayer({
    video: document.getElementById('mseVideo'),
    io: window.io,
    namespace: 'mse',
    controls: ''
  }, (err, msg) => {
    if (err) {
      console.error('mse', err)
      console.log(document.getElementById('mseVideo').error)
    }
  })
  msePlayer.start()

  /* -------------------- cleanup -------------------- */

  window.addEventListener('beforeunload', (evt) => {
    stderrSocket.disconnect()
    progressSocket.disconnect()
    m3u8Socket.disconnect()
    mimeSocket.disconnect()
    jpegSocket.disconnect()
    mjpegImg.src = ''
    mp4Video.pause()
    hlsVideo.pause()
    hlsjsVideo.pause()
    msePlayer.stop()
  })
})()
