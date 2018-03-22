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
  var values = vals || {
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
  };
  var elems = document.getElementsByClassName('mdl-textfield__input');
  var dispatchChangeEvent = typeof window.Event === 'function' ? function (el) {
    el.dispatchEvent(new window.Event('change'));
  } : function (el) {
    var event = document.createEvent('Event');
    event.initEvent('change', true, true);
    el.dispatchEvent(event);
  };
  for (var i = 0; i < elems.length; i++) {
    var elem = elems[i];
    var name = elem.name;
    var value = values[name];
    if (typeof value !== 'undefined') {
      elem.value = value;
      dispatchChangeEvent(elem);
    }
  }
})(JSON.parse(document.getElementById('values').dataset.vals));

//# sourceMappingURL=index.js.map