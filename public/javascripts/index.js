const inputType = document.getElementById('inputType');

inputType.addEventListener('change', (evt) => {
    const elems = document.getElementsByClassName('rtsp-transport');
    switch (inputType.value) {
        case 'rtsp':
            for (let i = 0; i < elems.length; i++) {
                elems[i].style.display = 'inline';
            }
            break;
        case 'mjpeg':
        case 'hls':
        case 'mp4':
            for (let i = 0; i < elems.length; i++) {
                elems[i].style.display = 'none';
            }
            break;
    }
});

const mp4VideoCodec = document.getElementById('mp4VideoCodec');

mp4VideoCodec.addEventListener('change', (evt) => {
    const elems = document.getElementsByClassName('mp4VideoCodec');
    switch (mp4VideoCodec.value) {
        case 'copy':
            for (let i = 0; i < elems.length; i++) {
                elems[i].style.display = 'none';
            }
            break;
        case 'libx264':
            for (let i = 0; i < elems.length; i++) {
                elems[i].style.display = 'inline';
            }
            break;
    }
});

const jpegCodec = document.getElementById('jpegCodec');

jpegCodec.addEventListener('change', (evt) => {
    const elems = document.getElementsByClassName('jpegCodec');
    switch (jpegCodec.value) {
        case 'copy':
            for (let i = 0; i < elems.length; i++) {
                elems[i].style.display = 'none';
            }
            break;
        case 'mjpeg':
            for (let i = 0; i < elems.length; i++) {
                elems[i].style.display = 'inline';
            }
            break;
    }
});

const elementIds = ['logLevel', 'hwAccel', 'inputType', 'analyzeDuration', 'probeSize', 'rtspTransport', 'inputUrl', 'mp4HlsListSize', 'mp4AudioCodec', 'mp4VideoCodec', 'mp4Rate', 'mp4Scale', 'fragDuration', 'mp4Crf', 'mp4Preset', 'mp4Profile', 'mp4Level', 'jpegCodec', 'jpegRate', 'jpegScale', 'jpegQuality'];

if (vals) {
    for (let i = 0, len = elementIds.length; i < len; i++) {
        const elem = document.getElementById(elementIds[i]);
        elem.value = vals[elementIds[i]];
        elem.dispatchEvent(new Event('change'));
    }
} else {
    const defaultVals = ['warning', 'auto', 'hls', '10000000', '1048576', 'tcp', 'http://184.72.239.149/vod/smil:BigBuckBunny.smil/playlist.m3u8', '3', 'aac', 'copy', '7', '0.75', '1000000', '10', 'none', 'none', 'none', 'mjpeg', '7', '0.75', '10'];
    for (let i = 0, len = elementIds.length; i < len; i++) {
        const elem = document.getElementById(elementIds[i]);
        elem.value = defaultVals[i];
        elem.dispatchEvent(new Event('change'));
    }
}