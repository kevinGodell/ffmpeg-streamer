'use strict';

(function init () {
  const inputType = document.getElementById('inputType')
  inputType.addEventListener('change', (/* evt */) => {
    const elems = document.getElementsByClassName('rtsp-transport')
    switch (inputType.value) {
      case 'rtsp':
        for (let i = 0; i < elems.length; i++) {
          elems[i].style.display = 'inline'
        }
        break
      case 'mjpeg':
      case 'hls':
      case 'mp4':
        for (let i = 0; i < elems.length; i++) {
          elems[i].style.display = 'none'
        }
        break
    }
  })
  const mp4VideoCodec = document.getElementById('mp4VideoCodec')
  mp4VideoCodec.addEventListener('change', (/* evt */) => {
    const elems = document.getElementsByClassName('mp4VideoCodec')
    switch (mp4VideoCodec.value) {
      case 'copy':
        for (let i = 0; i < elems.length; i++) {
          elems[i].style.display = 'none'
        }
        break
      case 'libx264':
        for (let i = 0; i < elems.length; i++) {
          elems[i].style.display = 'inline'
        }
        break
    }
  })
  const jpegCodec = document.getElementById('jpegCodec')
  jpegCodec.addEventListener('change', (/* evt */) => {
    const elems = document.getElementsByClassName('jpegCodec')
    switch (jpegCodec.value) {
      case 'copy':
        for (let i = 0; i < elems.length; i++) {
          elems[i].style.display = 'none'
        }
        break
      case 'mjpeg':
        for (let i = 0; i < elems.length; i++) {
          elems[i].style.display = 'inline'
        }
        break
    }
  })
})();

(function setValues (vals) {
  const values = vals || {
    logLevel: 'info',
    hwAccel: 'auto',
    inputType: 'hls',
    analyzeDuration: 10000000,
    probeSize: 1048576,
    rtspTransport: 'tcp',
    inputUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/hls/TearsOfSteel.m3u8',
    mp4HlsListSize: 5,
    mp4AudioCodec: 'aac',
    mp4VideoCodec: 'copy',
    mp4Rate: 7,
    mp4Scale: 0.75,
    mp4FragDur: 2000000,
    mp4Crf: 15,
    mp4Preset: 'veryfast',
    mp4Profile: 'baseline',
    mp4Level: 3.1,
    mp4PixFmt: 'yuv420p',
    jpegCodec: 'mjpeg',
    jpegRate: 7,
    jpegScale: 0.75,
    jpegQuality: 10
  }
  const elems = document.getElementsByClassName('mdl-textfield__input')
  const dispatchChangeEvent = typeof window.Event === 'function' ? (el) => {
    el.dispatchEvent(new window.Event('change'))
  } : (el) => {
    const event = document.createEvent('Event')
    event.initEvent('change', true, true)
    el.dispatchEvent(event)
  }
  for (let i = 0; i < elems.length; i++) {
    const elem = elems[i]
    const name = elem.name
    const value = values[name]
    if (typeof value !== 'undefined') {
      elem.value = value
      dispatchChangeEvent(elem)
    }
  }
})(JSON.parse(document.getElementById('values').dataset.vals))
