'use strict'

const ffmpegConfig = require('../lib/ffmpegConfig')
const ffbinaries = require('ffbinaries')
const namespace = '/install'

let downloading = false

module.exports = (app, io) => {
  io

    .of(namespace)

    .on('connection', (socket) => {
      socket.on('download', () => {
        const ffmpeg = app.get('ffmpeg')

        if (ffmpeg && ffmpeg.running) {
          ffmpeg.stop()
        }

        socket.emit('status', {type: 'downloading'})

        if (downloading) {
          return
        }

        downloading = true

        ffbinaries.clearCache()

        const dirName = app.get('dirName')

        ffbinaries.downloadBinaries('ffmpeg', {quiet: true, destination: dirName, force: true}, (err, data) => {
          if (err) {
            socket.emit('status', {type: 'fail', msg: err})
            console.error(err)
          } else {
            const ffmpeg = ffmpegConfig(dirName)
            app.set('ffmpegVersion', ffmpeg.version)
            app.set('ffmpegPath', ffmpeg.path)
            socket.emit('status', {type: 'complete'})
          }

          downloading = false
        })
      })
    })
}
