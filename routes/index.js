'use strict';

const express = require('express');
const router = express.Router();
const FR = require('ffmpeg-respawn');
const M4F = require('mp4frag');
const P2J = require('pipe2jpeg');
const packageJson = require('../package');
const title = `${packageJson.name} ver: ${packageJson.version}`;
let values = null;

function renderIndex(res, msg, vals) {
    const app = res.app;
    res.render('index', {
        title: title,
        subTitle: `ffmpeg ver: ${app.get('ffmpegVersion')}`,
        message: msg,
        values: vals
    });
}

function renderVideo(res, params) {
    res.render('video', {
        title: 'video',
        params: params
    });
}

function renderInstall(res) {
    const app = res.app;
    res.render('install', {
        title: 'Dependency Error',
        subTitle: 'FFMPEG not found on system.',
        message: `Would you like to install ffmpeg in the current directory?`,
        directory: app.get('dirName')
    });
}

router.get('/install', function (req, res) {
    renderInstall(res);
});

router.get('/', function (req, res) {
    const app = req.app;
    if (!app.get('ffmpegPath')) {
        renderInstall(res);
        return;
    }
    const ffmpeg = app.get('ffmpeg');
    if (ffmpeg && ffmpeg.running) {
        return renderVideo(res, ffmpeg.params);
    }
    return renderIndex(res, null, values);
});

router.post('/', function (req, res) {
    const app = req.app;
    let ffmpeg = app.get('ffmpeg');
    let mp4frag = app.get('mp4frag');
    let pipe2jpeg = app.get('pipe2jpeg');
    if (ffmpeg && ffmpeg.running) {
        ffmpeg.stop();
    }
    const body = req.body;
    switch (body.action) {
        case 'Exit':
            res.render('exit', {
                title: 'GAME OVER',
                message: 'Insert coin to continue'
            });
            return process.exit(0);
        case 'Stop':
            return renderIndex(res, null, values);
        case 'Start':

            /* +++++++++ gather form input values ++++++++++ */

            values = body;

            //mandatory, will be passed to ffmpeg-respawn
            const logLevel = values.logLevel;

            //mandatory
            const hwAccel = values.hwAccel;

            //optional
            const analyzeDuration = values.analyzeDuration;

            //optional
            const probeSize = values.probeSize;

            //mandatory
            const inputType = values.inputType;

            //mandatory
            const inputUrl = values.inputUrl;

            //optional
            const rtspTransport = values.rtspTransport;

            //mandatory
            const mp4HlsListSize = values.mp4HlsListSize;

            //mandatory
            const mp4AudioCodec = values.mp4AudioCodec;

            //mandatory
            const mp4VideoCodec = values.mp4VideoCodec;

            //optional
            const mp4Rate = values.mp4Rate;

            //optional
            const mp4Scale = values.mp4Scale;

            //optional
            const fragDuration = values.fragDuration;

            //optional
            const mp4Crf = values.mp4Crf;

            //optional
            const mp4Preset = values.mp4Preset;

            //optional
            const mp4Profile = values.mp4Profile;

            //optional
            const mp4Level = values.mp4Level;

            //mandatory
            const jpegCodec = values.jpegCodec;

            //optional
            const jpegRate = values.jpegRate;

            //optional
            const jpegScale = values.jpegScale;

            //optional
            const jpegQuality = values.jpegQuality;

            /* +++++++++ process form input values ++++++++++ */

            //params to be passed to ffmpeg
            const params = [];

            params.push(...['-hwaccel', hwAccel]);

            if (analyzeDuration !== 'none') {
                params.push(...['-analyzeduration', analyzeDuration]);
            }

            if (probeSize !== 'none') {
                params.push(...['-probesize', probeSize]);
            }

            switch (inputType) {

                case 'artificial':
                    params.push(...['-re', '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=15']);
                    break;

                case 'rtsp':
                    if (inputUrl.indexOf('rtsp://') === -1) {
                        return renderIndex(res, 'Input url must begin with rtsp://', values);
                    }
                    if (rtspTransport !== 'none') {
                        params.push(...['-rtsp_transport', rtspTransport]);
                    }
                    params.push(...['-f', 'rtsp', '-i', inputUrl]);
                    break;

                case 'mjpeg':
                    if (inputUrl.indexOf('http://') === -1 && inputUrl.indexOf('https://') === -1) {
                        return renderIndex(res, 'Input url must begin with http(s)://', values);
                    }
                    params.push(...['-re', '-use_wallclock_as_timestamps', '1', '-f', 'mjpeg', '-i', inputUrl]);
                    break;

                default:
                    throw new Error('unsupported input type');
            }

            if (mp4AudioCodec === 'an') {
                params.push('-an');
            } else {
                params.push(...['-c:a', mp4AudioCodec]);
            }

            params.push(...['-c:v', mp4VideoCodec]);

            if (mp4VideoCodec !== 'copy') {

                params.push(...['-tune', 'zerolatency']);

                if (mp4Rate !== 'none') {
                    params.push(...['-r', mp4Rate]);
                }

                if (mp4Scale !== 'none') {
                    params.push(...['-vf', `scale=trunc(iw*${mp4Scale}/2)*2:-2`]);
                }

                if (fragDuration !== 'none') {
                    params.push(...['-min_frag_duration', fragDuration, '-frag_duration', fragDuration]);
                }

                if (mp4Crf !== 'none') {
                    params.push(...['-crf', mp4Crf]);
                }

                if (mp4Preset !== 'none') {
                    params.push(...['-preset', mp4Preset]);
                }

                if (mp4Profile !== 'none') {
                    params.push(...['-profile:v', mp4Profile]);
                }

                if (mp4Level !== 'none') {
                    params.push(...['-level', mp4Level]);
                }

            }

            params.push(...['-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof', 'pipe:1']);

            params.push(...['-c', jpegCodec]);

            if (jpegCodec !== 'copy') {

                if (jpegQuality !== 'none') {
                    params.push(...['-q', jpegQuality]);
                }

                if (jpegRate !== 'none') {
                    params.push(...['-r', jpegRate]);
                }

                if (jpegScale !== 'none') {
                    params.push(...['-vf', `scale=trunc(iw*${jpegScale}/2)*2:-2`]);//,format=yuv420p
                }

            }

            params.push(...['-f', 'image2pipe', 'pipe:4']);

            mp4frag = new M4F({hlsBase: 'test', hlsListSize: mp4HlsListSize})
                .on('error', (err)=> {
                console.error(err.message);
                //console.log(ffmpeg.running);
                //ffmpeg.stop();
            });
            app.set('mp4frag', mp4frag);
            pipe2jpeg = new P2J();
            app.set('pipe2jpeg', pipe2jpeg);
            try {
                ffmpeg = new FR(
                    {
                        path: app.get('ffmpegPath'),
                        params: params,
                        logLevel: logLevel,
                        pipes: [
                            {stdioIndex: 1, destination: mp4frag},
                            {stdioIndex: 4, destination: pipe2jpeg}
                        ],
                        killAfterStall: 10,
                        spawnAfterExit: 2,
                        reSpawnLimit: 10,
                        logCallback: (data) => {
                            console.log(data.toString());
                        },
                        exitCallback: () => {
                            //console.log('exit call back');
                            mp4frag.resetCache();
                        }
                    })
                    .on('fail', (msg)=> {
                        console.log('fail', msg);
                    })
                    .start();
                app.set('ffmpeg', ffmpeg);
            } catch (error) {
                return renderIndex(res, error.message, values);
            }
            return renderVideo(res, ffmpeg.params);
    }
});

module.exports = router;

//http://222.100.79.51:50000/nphMotionJpeg?Resolution=640x480&Quality=High
//http://119.195.110.154/mjpg/video.mjpg
//http://68.118.68.116/-wvhttp-01-/GetOneShot?image_size=640x480&frame_count=no_limit