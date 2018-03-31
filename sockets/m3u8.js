'use strict'

const namespace = '/m3u8'

module.exports = (app, io) => {
  io
    .of(namespace)
    .on('connection', (socket) => {
      const mp4frag = app.get('mp4frag')

      if (!mp4frag) {
        socket.disconnect()
        return
      }

      const emitM3u8 = () => {
        socket.emit('m3u8', mp4frag.m3u8)
      }

      if (mp4frag.m3u8) {
        emitM3u8()
      } else {
        mp4frag.once('initialized', emitM3u8)
      }

      mp4frag.on('segment', emitM3u8)

      socket.once('disconnect', () => {
        if (mp4frag) {
          mp4frag.removeListener('initialized', emitM3u8)
          mp4frag.removeListener('segment', emitM3u8)
        }
      })
    })
}
