'use strict';

const express = require('express');
const router = express.Router();
const FR = require('ffmpeg-respawn');
const M4F = require('mp4frag');
const P2J = require('pipe2jpeg');
const packageJson = require('../package');
const title = `${packageJson.name} ver: ${packageJson.version}`;

function renderIndex(res, msg) {
    const app = res.app;
    res.render('index', {
        title: title,
        subTitle: `ffmpeg ver: ${app.get('ffmpegVersion')}`,
        message: msg
    });
}

function renderVideo(res, params) {
    res.render('video', {
        title: 'video',
        params: params
    });
}

function renderInputError(res, msg) {
    const app = res.app;
    res.render('index', {
        title: title,
        subTitle: `ffmpeg ver: ${app.get('ffmpegVersion')}`,
        message: msg
    });
}

router.get('/', function (req, res) {
    const app = req.app;

    if (!app.get('ffmpegVersion')) {
        res.render('install', {
            title: 'Dependency Error',
            subTitle: 'FFMPEG not found on system.',
            message: 'Would like to automatically install ffmpeg in the current directory?'
        });
        return;
    }

    const ffmpeg = app.get('ffmpeg');
    if (ffmpeg && ffmpeg.running) {
        return renderVideo(res, ffmpeg.params);
    }

    return renderIndex(res);
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
            process.exit(0);
            break;
        case 'Stop':
            return renderIndex(res);
        case 'Install':
            const ffbinaries = require('ffbinaries');
            ffbinaries.downloadFiles('ffmpeg', {quiet: true, destination: app.get('dirName')}, function (err, data) {
                console.log('Installing ffmpeg...');
                if (err) {
                    console.error(err);
                    res.render('error', {
                        message: 'Ffmpeg installation failure',
                        status: err,
                        stack: ''
                    });
                    return;
                }
                console.log(data);
                ffbinaries.clearCache();
                const configure = require('../lib/configure');
                configure(app);
                return renderIndex(res);
            });
            break;
        case 'Start':

            if (!body.inputUrl) {
                renderInputError(res, 'Input url is required.');
                return;
            }

            //params to be passed to ffmpeg
            const params = [];

            /* +++++++++ gather form input values ++++++++++ */

            //mandatory, will be passed to ffmpeg-respawn
            const logLevel = body.logLevel;

            //mandatory
            const hwAccel = body.hwAccel;

            //optional
            const analyzeDuration = body.analyzeDuration;

            //optional
            const probeSize = body.probeSize;

            //mandatory
            const inputType = body.inputType;

            //mandatory
            const rtspTransport = body.rtspTransport;

            //mandatory
            const mp4AudioCodec = body.mp4AudioCodec;

            //mandatory
            const mp4VideoCodec = body.mp4VideoCodec;

            //mandatory
            const rate = body.mp4Rate;

            //mandatory
            const scale = body.mp4Scale;

            //mandatory
            const mp4PixFmt = body.mp4PixFmt;

            //mandatory
            const fragDuration = body.fragDuration;

            //mandatory
            const crf = body.crf;

            //mandatory
            const preset = body.preset;

            //mandatory
            const mp4Profile = body.mp4Profile;

            //mandatory
            const mp4Level = body.mp4Level;

            //mandatory
            const jpegRate = body.jpegRate;

            //mandatory
            const jpegScale = body.jpegScale;

            //mandatory
            const jpegQuality = body.jpegQuality;

            /* +++++++++ process form input values ++++++++++ */

            params.push(...['-hwaccel', hwAccel]);

            if (analyzeDuration) {
                params.push(...['-analyzeduration', analyzeDuration]);
            }

            if (probeSize) {
                params.push(...['-probesize', probeSize]);
            }

            switch (inputType) {
                /*case 'artificial':
                    params.push(...['-re', '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=15']);
                    break;*/

                case 'rtsp':
                    if (body.inputUrl.indexOf('rtsp://') === -1) {
                        return renderIndex(res, 'Input url must begin with rtsp://');
                    }
                    params.push(...['-rtsp_transport', rtspTransport]);
                    params.push(...['-i', body.inputUrl]);
                    break;
                case 'mjpeg':
                    if (body.inputUrl.indexOf('http://') === -1 && body.inputUrl.indexOf('https://') === -1) {
                        return renderIndex(res, 'Mjpeg url must begin with http(s)://');
                    }
                    params.push(...['-re', '-i', body.inputUrl]);
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

                params.push(...['-vf', `fps=${rate},scale=trunc(iw*${scale}/2)*2:-2,format=${mp4PixFmt}`]);

                params.push(...['-min_frag_duration', fragDuration, '-frag_duration', fragDuration]);

                params.push(...['-crf', crf]);

                params.push(...['-preset', preset]);

                params.push(...['-tune', 'zerolatency']);

                params.push(...['-profile:v', mp4Profile]);

                params.push(...['-level', mp4Level]);

            }

            params.push(...['-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof', 'pipe:1']);
            //params.push(...['-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof+omit_tfhd_offset', 'pipe:1']);

            params.push(...['-an', '-c:v', 'mjpeg', '-f', 'image2pipe', '-q:v', jpegQuality, '-vf', `fps=${jpegRate},scale=trunc(iw*${jpegScale}/2)*2:-2,format=yuv420p`, 'pipe:4']);

            mp4frag = new M4F({hlsBase: 'test', hlsListSize: 4})
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
                        path: 'ffmpeg',
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
                        console.log(msg);
                    })
                    .start();
                app.set('ffmpeg', ffmpeg);
            } catch (error) {
                return renderIndex(res, error.message);
            }
            renderVideo(res, ffmpeg.params);
            break;
    }
});

module.exports = router;

//http://222.100.79.51:50000/nphMotionJpeg?Resolution=640x480&Quality=High
//http://119.195.110.154/mjpg/video.mjpg
//http://68.118.68.116/-wvhttp-01-/GetOneShot?image_size=640x480&frame_count=no_limit