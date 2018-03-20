'use strict'

const express = require('express')
const router = express.Router()
const {PassThrough} = require('stream')
const FR = require('ffmpeg-respawn')
const M4F = require('mp4frag')
const P2J = require('pipe2jpeg')
const packageJson = require('../package')
const title = `${packageJson.name} ver: ${packageJson.version}`
let values = null

function renderIndex (res, msg, vals) {
  const app = res.app
  res.render('index', {
    title: title,
    subTitle: `ffmpeg ver: ${app.get('ffmpegVersion')}`,
    message: msg,
    values: vals
  })
}

function renderVideo (res, params) {
  res.render('video', {
    title: 'video',
    params: params
  })
}

function renderInstall (res) {
  const app = res.app
  res.render('install', {
    title: 'FFMPEG Dependency Error',
    subTitle: 'Not found on system.',
    message: `Would you like to install an updated copy of ffmpeg in this directory?`,
    directory: app.get('dirName')
  })
}

function renderActivity (res) {
  const app = res.app
  res.render('activity', {
    title: 'Activity Logging',
    subTitle: 'Save a list of most recent parameters.',
    message: `Would you like to create or destroy the activity log?`,
    directory: app.get('dirName')
  })
}

router.get('/activity', (req, res) => {
  renderActivity(res)
})

router.get('/', (req, res) => {
  const app = req.app
  if (!app.get('ffmpegPath')) {
    renderInstall(res)
    return
  }
  const ffmpeg = app.get('ffmpeg')
  if (ffmpeg && ffmpeg.running) {
    return renderVideo(res, ffmpeg.params)
  }
  const activity = app.get('activity')
  if (activity.running && activity.lastActivity) {
    return renderIndex(res, null, activity.lastActivity)
  }
  return renderIndex(res, null, null)
})

router.post('/', (req, res) => {
  const app = req.app
  const activity = app.get('activity')
  let ffmpeg = app.get('ffmpeg')
  let mp4frag = app.get('mp4frag')
  let pipe2jpeg = app.get('pipe2jpeg')
  let stderrLogs = app.get('stderrLogs')
  if (ffmpeg && ffmpeg.running) {
    ffmpeg.stop()
  }
  const body = req.body
  switch (body.action) {
    case 'Create':
      activity.create()
      return renderIndex(res, null, values)
    case 'Destroy':
      activity.destroy()
      return renderIndex(res, null, values)
    case 'Exit':
      res.render('exit', {
        title: 'GAME OVER',
        message: 'Insert coin to continue'
      })
      return process.exit(0)
    case 'Stop':
      return renderIndex(res, null, values)
    case 'Start':

      if (activity.running) {
        activity.add(body)
      }

      /* +++++++++ gather form input values ++++++++++ */

      values = body

      /** @param {String} values.logLevel - (-loglevel logLevel) */
      const logLevel = values.logLevel

      /** @param {String} values.hwAccel - (-hwaccel hwAccel) */
      const hwAccel = values.hwAccel

      /** @param {Number} [values.analyzeDuration] - (-analyzeduration analyzeDuration) 0 - 10000000 */
      const analyzeDuration = values.analyzeDuration

      /** @param {Number} [values.probeSize] - (-probesize probeSize) 32 - 1048576 */
      const probeSize = values.probeSize

      /** @param {String} values.inputType - (-f inputType) */
      const inputType = values.inputType

      /** @param {String} values.inputUrl - (-i inputUrl) */
      const inputUrl = values.inputUrl

      /** @param {String} [values.rtspTransport] - (-rtsp_transport rtspTransport) */
      const rtspTransport = values.rtspTransport

      /** @param {Number} values.mp4HlsListSize - (mp4frag.hlsListSize = mp4HlsListSize) 2 - 5 */
      const mp4HlsListSize = values.mp4HlsListSize

      /** @param {String} values.mp4AudioCodec - (-c:a mp4AudioCodec or -an) */
      const mp4AudioCodec = values.mp4AudioCodec

      /** @param {String} values.mp4VideoCodec - (-c:v mp4VideoCodec) */
      const mp4VideoCodec = values.mp4VideoCodec

      /** @param {Number} [values.mp4Rate] - (-r mp4Rate) 1 - 30 */
      const mp4Rate = values.mp4Rate

      /** @param {Number} [values.mp4Scale] - (-vf scale=trunc(iw*mp4Scale/2)*2:-2) .10 - 1 */
      const mp4Scale = values.mp4Scale

      /** @param {Number} [values.mp4FragDur] - (-min_frag_duration mp4FragDur -frag_duration mp4FragDur) */
      const mp4FragDur = values.mp4FragDur

      /** @param {Number} [values.mp4Crf] - (-crf mp4Crf) 0 - 51 */
      const mp4Crf = values.mp4Crf

      /** @param {String} [values.mp4Preset] - (-preset mp4Preset) */
      const mp4Preset = values.mp4Preset

      /** @param {String} [values.mp4Profile] - (-profile:v mp4Profile) */
      const mp4Profile = values.mp4Profile

      /** @param {Number} [values.mp4Level] - (-level:v mp4Level) */
      const mp4Level = values.mp4Level

      /** @param {String} [values.mp4PixFmt] - (-pix_fmt mp4PixFmt) */
      const mp4PixFmt = values.mp4PixFmt

      /** @param {String} values.jpegCodec - (-c jpegCodec) */
      const jpegCodec = values.jpegCodec

      /** @param {Number} [values.jpegRate] - (-r jpegRate) 1 - 30 */
      const jpegRate = values.jpegRate

      /** @param {Number} [values.jpegScale] - (-vf scale=trunc(iw*jpegScale/2)*2:-2) .10 - 1 */
      const jpegScale = values.jpegScale

      /** @param {Number} [values.jpegQuality] - (-q jpegQuality) 1 - 31 */
      const jpegQuality = values.jpegQuality

      /* +++++++++ process form input values ++++++++++ */

      // params to be passed to ffmpeg
      const params = []

      params.push(...['-hwaccel', hwAccel])

      if (analyzeDuration !== 'none') {
        params.push(...['-analyzeduration', analyzeDuration])
      }

      if (probeSize !== 'none') {
        params.push(...['-probesize', probeSize])
      }

      params.push('-re')

      switch (inputType) {
        case 'artificial':
          params.push(...['-f', 'lavfi', '-i', 'testsrc=size=1280x720:rate=15'])
          break

        case 'mp4':
          // mp4 might be a local file, dont check url
          /* if (inputUrl.indexOf('http://') !== 0 && inputUrl.indexOf('https://') !== 0) {
            return renderIndex(res, 'Input url must begin with http(s)://', values)
          } */
          params.push(...['-f', 'mp4', '-i', inputUrl])
          break

        case 'hls':
          if (inputUrl.indexOf('http://') !== 0 && inputUrl.indexOf('https://') !== 0) {
            return renderIndex(res, 'Input url must begin with http(s)://', values)
          }
          params.push(...['-f', 'hls', '-i', inputUrl])
          break

        case 'rtsp':
          if (inputUrl.indexOf('rtsp://') !== 0) {
            return renderIndex(res, 'Input url must begin with rtsp://', values)
          }
          if (rtspTransport !== 'none') {
            params.push(...['-rtsp_transport', rtspTransport])
          }
          params.push(...['-f', 'rtsp', '-i', inputUrl])
          break

        case 'mjpeg':
          if (inputUrl.indexOf('http://') !== 0 && inputUrl.indexOf('https://') !== 0) {
            return renderIndex(res, 'Input url must begin with http(s)://', values)
          }
          params.push(...['-use_wallclock_as_timestamps', '1', '-f', 'mjpeg', '-i', inputUrl])
          break

        default:
          throw new Error('unsupported input type')
      }

      if (mp4AudioCodec === 'an') {
        params.push('-an')
      } else {
        params.push(...['-c:a', mp4AudioCodec])
      }

      params.push(...['-c:v', mp4VideoCodec])

      if (mp4VideoCodec !== 'copy') {
        params.push(...['-tune', 'zerolatency'])

        if (mp4Rate !== 'none') {
          params.push(...['-r', mp4Rate])
        }

        if (mp4Scale !== 'none') {
          params.push(...['-vf', `scale=trunc(iw*${mp4Scale}/2)*2:-2`])
        }

        if (mp4FragDur !== 'none') {
          params.push(...['-min_frag_duration', mp4FragDur, '-frag_duration', mp4FragDur])
        }

        if (mp4Crf !== 'none') {
          params.push(...['-crf', mp4Crf])
        }

        if (mp4Preset !== 'none') {
          params.push(...['-preset', mp4Preset])
        }

        if (mp4Profile !== 'none') {
          params.push(...['-profile:v', mp4Profile])
        }

        if (mp4Level !== 'none') {
          params.push(...['-level:v', mp4Level])
        }

        if (mp4PixFmt !== 'none') {
          params.push(...['-pix_fmt', mp4PixFmt])
        }
      }

      params.push(...['-f', 'mp4', '-movflags', '+dash+negative_cts_offsets', 'pipe:1'])

      // +frag_keyframe needed for all, +empty_moov for firefox, +default_base_moof+negative_cts_offsets for chrome

      // params.push(...['-f', 'mp4', '-movflags', '+empty_moov+default_base_moof+negative_cts_offsets', 'pipe:1']);//+frag_keyframe needed for all, +empty_moov for firefox, +default_base_moof+negative_cts_offsets for chrome

      // params.push(...['-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof+omit_tfhd_offset+frag_discont+global_sidx+dash+negative_cts_offsets', /*'-use_editlist', 0,  '-reset_timestamps', '1',*/ 'pipe:1']);

      // params.push(...['-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof+omit_tfhd_offset+frag_discont+global_sidx+dash+negative_cts_offsets', '-use_editlist', 0,  '-reset_timestamps', '1', 'pipe:1']);

      params.push(...['-c', jpegCodec])

      if (jpegCodec !== 'copy') {
        if (jpegQuality !== 'none') {
          params.push(...['-q', jpegQuality])
        }

        if (jpegRate !== 'none') {
          params.push(...['-r', jpegRate])
        }

        if (jpegScale !== 'none') {
          params.push(...['-vf', `scale=trunc(iw*${jpegScale}/2)*2:-2`])
        }
      }

      // TODO -f mpjpeg -boundary_tag ffmpeg_streamer so that we can later pipe response without parsing individual jpegs
      params.push(...['-f', 'image2pipe', 'pipe:4'])

      mp4frag = new M4F({hlsBase: 'test', hlsListSize: mp4HlsListSize})
        .setMaxListeners(30)
        .on('error', (err) => {
          console.error(err.message)
          // console.log(ffmpeg.running);
          // ffmpeg.stop();
        })

      app.set('mp4frag', mp4frag)

      pipe2jpeg = new P2J()
        .setMaxListeners(30)
        .on('error', (err) => {
          console.log(err.message)
        })

      app.set('pipe2jpeg', pipe2jpeg)

      stderrLogs = new PassThrough({
        transform (chunk, encoding, callback) {
          if (this._readableState.pipesCount > 0) {
            this.push(chunk)
          }
          callback()
        }
      })
        .setMaxListeners(30)
        .on('error', (err) => {
          console.log(err.message)
        })

      app.set('stderrLogs', stderrLogs)

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
            stderrLogs: stderrLogs,
            exitCallback: () => {
              // console.log('exit call back');
              mp4frag.resetCache()
            }
          })
          .on('fail', (msg) => {
            console.log('fail', msg)
          })
          .start()
        app.set('ffmpeg', ffmpeg)
      } catch (error) {
        return renderIndex(res, error.message, values)
      }
      return renderVideo(res, ffmpeg.params)
  }
})

module.exports = router

// http://222.100.79.51:50000/nphMotionJpeg?Resolution=640x480&Quality=High
// http://119.195.110.154/mjpg/video.mjpg
// http://68.118.68.116/-wvhttp-01-/GetOneShot?image_size=640x480&frame_count=no_limit
// https://bitdash-a.akamaihd.net/content/MI201109210084_1/m3u8s/f08e80da-bf1d-4e3d-8899-f0f6155f6efa.m3u8
// http://184.72.239.149/vod/smil:BigBuckBunny.smil/playlist.m3u8
// https://kevingodell.github.io/streams/hls_fmp4/hls.m3u8
// http://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/hls/TearsOfSteel.m3u8
// http://commondatastorage.googleapis.com/gtv-videos-bucket/
