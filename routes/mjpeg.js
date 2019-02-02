'use strict'

const express = require('express')
const router = express.Router()
const { Writable } = require('stream')

router.use('/', (req, res, next) => {
  const app = req.app
  const pipe2jpeg = app.get('pipe2jpeg')
  if (!pipe2jpeg) {
    res.status(404).send('mjpeg not available')
    res.destroy()
    return
  }
  res.locals.pipe2jpeg = pipe2jpeg
  res.set('Connection', 'close')
  res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate')
  res.set('Expires', '-1')
  res.set('Pragma', 'no-cache')
  next()
})

router.get('/', (req, res) => {
  res.send('mjpeg router')
})

router.get('/test.mjpg', (req, res) => {
  const pipe2jpeg = res.locals.pipe2jpeg
  const jpeg = pipe2jpeg.jpeg
  const writable = new Writable({
    write (chunk, encoding, callback) {
      res.write(`Content-Type: image/jpeg\r\nContent-Length: ${chunk.length}\r\n\r\n`)
      res.write(chunk)
      res.write('\r\n--ffmpeg_streamer\r\n')
      callback()
    }
  })
  res.set('Content-Type', 'multipart/x-mixed-replace;boundary=ffmpeg_streamer')
  res.write('--ffmpeg_streamer\r\n')
  if (jpeg) {
    writable.write(jpeg, { end: true })
  }
  pipe2jpeg.pipe(writable)
  res.once('close', () => {
    if (pipe2jpeg && writable) {
      pipe2jpeg.unpipe(writable)
    }
    res.destroy()
  })
})

module.exports = router
