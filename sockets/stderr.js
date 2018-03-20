'use strict'

const {Writable} = require('stream')
const namespace = '/stderr'

module.exports = (app, io) => {
  io
    .of(namespace)
    .on('connection', (socket) => {
      const stderrLogs = app.get('stderrLogs')

      if (!stderrLogs) {
        socket.disconnect()
        return
      }

      const writable = new Writable({
        write (chunk, encoding, callback) {
          socket.emit('stderr', chunk.toString())
          callback()
        }
      })

      stderrLogs.pipe(writable)

      socket.once('disconnect', () => {
        if (stderrLogs && writable) {
          stderrLogs.unpipe(writable)
        }
      })
    })
}
