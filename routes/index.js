'use strict';

const express = require('express');
const router = express.Router();
const FR = require('ffmpeg-respawn');
const M4F = require('mp4frag');
const P2J = require('pipe2jpeg');

function renderVideo(res, params) {
    res.render('video', {
        title: 'video',
        params: params
    });
}

router.get('/', function(req, res) {
    const app = req.app;
    const ffmpeg = app.get('ffmpeg');
    if (ffmpeg && ffmpeg.running) {
        renderVideo(res, ffmpeg.params);
    } else {
        res.render('index',{
            title: 'IP Cam Tester',
            header: 'Enter input parameters and rtsp url for the ip camera',
        });
    }
});

router.post('/', function(req, res) {
    const app = req.app;
    let ffmpeg = app.get('ffmpeg');
    if (req.body.action === "Exit") {
        process.exit(0);
    } else if (req.body.action === "Stop") {
        if (ffmpeg && ffmpeg.running) {
            ffmpeg.stop();
            ffmpeg = null;
            app.set('ffmpeg', null);
        }
        res.render('index', {
            title: 'IP Cam Tester',
            header: 'Enter input parameters and rtsp url for the ip camera',
        });
    } else if (req.body.action === "Start") {
        if (ffmpeg && ffmpeg.running) {
            renderVideo(res, ffmpeg.params);
        } else if (req.body.rtsp) {
            //todo, have drop down selections for standard options libx264
            const mp4frag = new M4F({hlsBase: 'test', hlsListSize: 4});
            app.set('mp4frag', mp4frag);
            const pipe2jpeg = new P2J();
            app.set('pipe2jpeg', pipe2jpeg);
            //if (req.body.params) {
                //todo process extra params to pass to ffmpeg
            //}
            const params = [
                '-rtsp_transport', 'tcp', '-i', req.body.rtsp,
                '-f', 'mp4', '-an', '-c:v', 'copy', '-movflags', '+frag_keyframe+empty_moov+default_base_moof+omit_tfhd_offset', 'pipe:1',
                '-f', 'image2pipe', '-an', '-c:v', 'mjpeg', '-huffman', 'optimal', '-q:v', '1', '-vf', 'fps=5,scale=-1:-1', 'pipe:4'
            ];
            try {
                ffmpeg = new FR(
                    {
                        params: params,
                        pipes: [
                            {stdioIndex: 1, destination: mp4frag},
                            {stdioIndex: 4, destination: pipe2jpeg}
                            ],
                        killAfterStall: 10,
                        spawnAfterExit: 5,
                        reSpawnLimit: 10000,
                        exitCallback: ()=>{mp4frag.resetCache();}
                    })
                    .start();
            } catch (error) {
                res.render('index', {
                    title: 'IP Cam Tester',
                    header: error.message,
                });
                return;
            }
            app.set('ffmpeg', ffmpeg);
            if (mp4frag.segment) {
                renderVideo(res, ffmpeg.params);
            } else {
                mp4frag.once('segment', ()=>{
                    renderVideo(res, ffmpeg.params);
                });
            }
        } else {
            res.render('index', {
                title: 'IP Cam Tester',
                header: '**ERROR** Enter parameters and rtsp url for the ip camera',
            });
        }
    }
});

module.exports = router;