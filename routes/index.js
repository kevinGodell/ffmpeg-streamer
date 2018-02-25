'use strict';

const express = require('express');
const router = express.Router();
const FR = require('ffmpeg-respawn');
const M4F = require('mp4frag');
const P2J = require('pipe2jpeg');
const packageJson = require('../package');
const title = `${packageJson.name} ver: ${packageJson.version}`;

function renderVideo(res, params) {
    res.render('video', {
        title: 'video',
        params: params
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
        renderVideo(res, ffmpeg.params);
        return;
    }
    res.render('index', {
        title: title,
        subTitle: `ffmpeg ver: ${app.get('ffmpegVersion')}`,
        message: 'Select parameters and enter rtsp url for the ip camera.'
    });
});

router.post('/', function (req, res) {
    const app = req.app;
    let ffmpeg = app.get('ffmpeg');
    if (ffmpeg && ffmpeg.running) {
        ffmpeg.stop();
    }
    const body = req.body;
    switch (body.action) {
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
                res.render('index', {
                    title: title,
                    subTitle: `ffmpeg ver: ${configure(app).ffmpegVersion}`,
                    message: 'Select parameters and enter rtsp url for the ip camera.'
                });
            });
            break;
        case 'Exit':
            process.exit(0);
            break;
        case 'Stop':
            res.render('index', {
                title: title,
                subTitle: `ffmpeg ver: ${app.get('ffmpegVersion')}`,
                message: 'Select parameters and enter rtsp url for the ip camera.'
            });
            break;
        case 'Start':
            if (!body.inputUrl) {
                res.render('index', {
                    title: title,
                    subTitle: `ffmpeg version: ${app.get('ffmpegVersion')}`,
                    message: '**ERROR** Missing input url.'
                });
                return;
            }

            //params to be passed to ffmpeg
            const params = [];

            //mandatory, will be passed to ffmpeg-respawn
            const logLevel = body.logLevel;

            //mandatory
            const hwAccel = body.hwAccel;
            params.push(...['-hwaccel', hwAccel]);

            //optional
            const analyzeDuration = body.analyzeDuration;
            if (analyzeDuration) {
                params.push(...['-analyzeduration', analyzeDuration]);
            }

            //optional
            const probeSize = body.probeSize;
            if (probeSize) {
                params.push(...['-probesize', probeSize]);
            }

            const inputType = body.inputType;
            console.log(inputType);
            switch (inputType) {
                /*case 'artificial':
                    params.push(...['-re', '-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=15']);
                    break;*/
                case 'rtsp':
                    //mandatory
                    const rtspTransport = body.rtspTransport;
                    params.push(...['-rtsp_transport', rtspTransport]);
                    //todo some regex here to atleast make sure beginns with rtsp
                    //mandatory
                    params.push(...['-i', body.inputUrl]);
                    break;
                case 'mjpeg':
                    //todo some regex here to atleast make sure beginns with http
                    //mandatory
                    params.push(...['-re', '-i', body.inputUrl]);
                    break;
                default:
                    throw new Error('unsupported input type');
            }

            //mandatory
            const ca = body.ca;
            if (ca === 'an') {
                params.push('-an');
            } else {
                params.push(...['-c:a', ca]);
            }

            //mandatory
            const cv = body.cv;
            params.push(...['-c:v', cv]);

            if (cv !== 'copy') {

                //mandatory
                const rate = body.mp4Rate;

                //mandatory
                const scale = body.mp4Scale;

                params.push(...['-vf', `fps=${rate},scale=trunc(iw*${scale}/2)*2:-2,format=yuv420p`]);

                //mandatory
                const fragDuration = body.fragDuration;
                params.push(...['-min_frag_duration', fragDuration, '-frag_duration', fragDuration]);

                //mandatory
                const crf = body.crf;
                params.push(...['-crf', crf]);

                //mandatory
                const preset = body.preset;
                params.push(...['-preset', preset]);

                params.push(...['-tune', 'zerolatency']);

                //optional
                const profile = body.profile;
                switch (profile) {
                    case 'baseline30' :
                        params.push(...['-profile:v', 'baseline', '-level', '3.0']);
                        break;
                    case 'baseline31' :
                        params.push(...['-profile:v', 'baseline', '-level', '3.1']);
                        break;
                    case 'main31' :
                        params.push(...['-profile:v', 'main', '-level', '3.1']);
                        break;
                    case 'main40':
                        params.push(...['-profile:v', 'main', '-level', '4.0']);
                        break;
                    case 'high40' :
                        params.push(...['-profile:v', 'high', '-level', '4.0']);
                        break;
                    case 'high41':
                        params.push(...['-profile:v', 'high', '-level', '4.1']);
                        break;
                    case 'high42' :
                        params.push(...['-profile:v', 'high', '-level', '4.2']);
                        break;
                }
            }

            params.push(...['-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof', 'pipe:1']);
            //params.push(...['-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof+omit_tfhd_offset', 'pipe:1']);

            //mandatory
            const jpegRate = body.jpegRate;

            //mandatory
            const jpegScale = body.jpegScale;

            //mandatory
            const jpegQuality = body.jpegQuality;

            params.push(...['-an', '-c:v', 'mjpeg', '-f', 'image2pipe', '-q:v', jpegQuality, '-vf', `fps=${jpegRate},scale=trunc(iw*${jpegScale}/2)*2:-2,format=yuv420p`, 'pipe:4']);

            const mp4frag = new M4F({hlsBase: 'test', hlsListSize: 4});

            app.set('mp4frag', mp4frag);

            const pipe2jpeg = new P2J();

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
                        killAfterStall: 60,
                        spawnAfterExit: 1,
                        reSpawnLimit: 10000,
                        logCallback: (data) => {
                            console.log(data.toString());
                        },
                        exitCallback: () => {
                            mp4frag.resetCache();
                        }
                    })
                    .start();
            } catch (error) {
                res.render('index', {
                    title: title,
                    subTitle: `ffmpeg ver: ${app.get('ffmpegVersion')}`,
                    message: error.message
                });
                return;
            }
            app.set('ffmpeg', ffmpeg);
            renderVideo(res, ffmpeg.params);
            break;
    }
});

module.exports = router;

//http://222.100.79.51:50000/nphMotionJpeg?Resolution=640x480&Quality=High
//http://119.195.110.154/mjpg/video.mjpg