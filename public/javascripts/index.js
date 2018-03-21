'use strict';

(function init() {
  var inputType = document.getElementById('inputType');

  inputType.addEventListener('change', function () /* evt */{
    var elems = document.getElementsByClassName('rtsp-transport');

    switch (inputType.value) {
      case 'rtsp':
        for (var i = 0; i < elems.length; i++) {
          elems[i].style.display = 'inline';
        }
        break;
      case 'mjpeg':
      case 'hls':
      case 'mp4':
        for (var _i = 0; _i < elems.length; _i++) {
          elems[_i].style.display = 'none';
        }
        break;
    }
  });

  var mp4VideoCodec = document.getElementById('mp4VideoCodec');

  mp4VideoCodec.addEventListener('change', function () /* evt */{
    var elems = document.getElementsByClassName('mp4VideoCodec');

    switch (mp4VideoCodec.value) {
      case 'copy':
        for (var i = 0; i < elems.length; i++) {
          elems[i].style.display = 'none';
        }
        break;
      case 'libx264':
        for (var _i2 = 0; _i2 < elems.length; _i2++) {
          elems[_i2].style.display = 'inline';
        }
        break;
    }
  });

  var jpegCodec = document.getElementById('jpegCodec');

  jpegCodec.addEventListener('change', function () /* evt */{
    var elems = document.getElementsByClassName('jpegCodec');

    switch (jpegCodec.value) {
      case 'copy':
        for (var i = 0; i < elems.length; i++) {
          elems[i].style.display = 'none';
        }
        break;
      case 'mjpeg':
        for (var _i3 = 0; _i3 < elems.length; _i3++) {
          elems[_i3].style.display = 'inline';
        }
        break;
    }
  });
})();

(function setValues(vals) {
  var elementIds = ['logLevel', 'hwAccel', 'inputType', 'analyzeDuration', 'probeSize', 'rtspTransport', 'inputUrl', 'mp4HlsListSize', 'mp4AudioCodec', 'mp4VideoCodec', 'mp4Rate', 'mp4Scale', 'mp4FragDur', 'mp4Crf', 'mp4Preset', 'mp4Profile', 'mp4Level', 'mp4PixFmt', 'jpegCodec', 'jpegRate', 'jpegScale', 'jpegQuality'];

  if (vals) {
    for (var i = 0, len = elementIds.length; i < len; i++) {
      var elem = document.getElementById(elementIds[i]);

      elem.value = vals[elementIds[i]];

      // elem.dispatchEvent(new window.Event('change'))
    }
  } else {
    var defaultVals = ['info', 'auto', 'hls', '10000000', '1048576', 'tcp', 'http://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/hls/TearsOfSteel.m3u8', '5', 'aac', 'copy', '7', '0.75', '2000000', '15', 'veryfast', 'baseline', '3.1', 'yuv420p', 'mjpeg', '7', '0.75', '10'];

    for (var _i4 = 0, _len = elementIds.length; _i4 < _len; _i4++) {
      var _elem = document.getElementById(elementIds[_i4]);

      _elem.value = defaultVals[_i4];

      if (typeof window.Event === 'function') {
        _elem.dispatchEvent(new window.Event('change'));
      } else {
        var event = document.createEvent('Event');
        event.initEvent('change', true, true);
        _elem.dispatchEvent(event);
      }

      // elem.dispatchEvent(new window.Event('change'))
    }
  }
})(JSON.parse(document.getElementById('values').dataset.vals));

//# sourceMappingURL=index.js.map