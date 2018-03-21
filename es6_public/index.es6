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
  const elementIds = ['logLevel', 'hwAccel', 'inputType', 'analyzeDuration', 'probeSize', 'rtspTransport', 'inputUrl', 'mp4HlsListSize', 'mp4AudioCodec', 'mp4VideoCodec', 'mp4Rate', 'mp4Scale', 'mp4FragDur', 'mp4Crf', 'mp4Preset', 'mp4Profile', 'mp4Level', 'mp4PixFmt', 'jpegCodec', 'jpegRate', 'jpegScale', 'jpegQuality']

  if (vals) {
    for (let i = 0, len = elementIds.length; i < len; i++) {
      const elem = document.getElementById(elementIds[i])

      elem.value = vals[elementIds[i]]

      // elem.dispatchEvent(new window.Event('change'))
    }
  } else {
    const defaultVals = ['info', 'auto', 'hls', '10000000', '1048576', 'tcp', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/hls/TearsOfSteel.m3u8', '5', 'aac', 'copy', '7', '0.75', '2000000', '15', 'veryfast', 'baseline', '3.1', 'yuv420p', 'mjpeg', '7', '0.75', '10']

    for (let i = 0, len = elementIds.length; i < len; i++) {
      const elem = document.getElementById(elementIds[i])

      elem.value = defaultVals[i]

      if (typeof window.Event === 'function') {
        elem.dispatchEvent(new window.Event('change'))
      } else {
        const event = document.createEvent('Event')
        event.initEvent('change', true, true)
        elem.dispatchEvent(event)
      }

      // elem.dispatchEvent(new window.Event('change'))
    }
  }
})(JSON.parse(document.getElementById('values').dataset.vals))
