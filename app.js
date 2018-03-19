'use strict'

const nodeEnv = process.env.NODE_ENV || 'production'

let port = normalizePort(process.env.PORT || '8181')
const portRange = port + 10

const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const io = require('socket.io').listen(server)
const path = require('path')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const ejs = require('ejs')

const index = require('./routes/index')
const install = require('./routes/install')
const hls = require('./routes/hls')
const mp4 = require('./routes/mp4')
const mjpeg = require('./routes/mjpeg')
const progress = require('./routes/progress')
const assets = require('./routes/assets')

const jpegSocket = require('./sockets/jpeg')(app, io)
const mseSocket = require('./sockets/mse')(app, io)
const progressSocket = require('./sockets/progress')(app, io)
const m3u8Socket = require('./sockets/m3u8')(app, io)
const installSocket = require('./sockets/install')(app, io)
const stderrSocket = require('./sockets/stderr')(app, io)

const dirName = process.pkg && process.pkg.entrypoint ? path.dirname(process.execPath) : process.cwd()
const ffmpeg = require('./lib/ffmpegConfig')(dirName)
const activity = require('./lib/activityLog')(dirName)

app.set('dirName', dirName)
app.set('ffmpegVersion', ffmpeg.version)
app.set('ffmpegPath', ffmpeg.path)
app.set('activity', activity)
app.set('env', nodeEnv)
app.set('port', port)
app.set('io', io)
app.set('jpegSocket', jpegSocket)
app.set('mseSocket', mseSocket)
app.set('progressSocket', progressSocket)
app.set('m3u8Socket', m3u8Socket)
app.set('installSocket', installSocket)
app.set('stderrSocket', stderrSocket)
app.set('ejs', ejs)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (nodeEnv === 'development') {
  // logs all requests to console
  app.use(logger('dev'))
}
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use('/assets', assets)
app.use('/', index)
app.use('/install', install)
app.use('/hls', hls)
app.use('/mp4', mp4)
app.use('/mjpeg', mjpeg)
app.use('/progress', progress)
app.use('/mdi', express.static(path.join(__dirname, 'node_modules/material-design-icons/iconfont')))
app.use('/mdl', express.static(path.join(__dirname, 'node_modules/material-design-lite/dist')))
app.use(express.static(path.join(__dirname, 'public')))

app.use(function (req, res, next) {
  const err = new Error('Not Found')
  console.error(`${req.url} not found.`)
  err.status = 404
  next(err)
})

app.use(function (err, req, res, next) {
  res.status(err.status || 500)
  res.render('error', {
    message: err.message,
    status: err.status,
    stack: nodeEnv === 'development' ? err.stack : ''
  })
  if (nodeEnv === 'development') {
    console.error(err)
  }
  // next(err);
})

if (nodeEnv === 'development') {
  app.use(logger('dev'))
}

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)

function normalizePort (val) {
  const port = parseInt(val, 10)
  if (isNaN(port)) {
    return val
  }
  if (port >= 0) {
    return port
  }
  return false
}

function onError (error) {
  if (error.syscall !== 'listen') {
    throw error
  }
  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges')
      return process.exit(1)
    case 'EADDRINUSE':
      console.error(`${bind} is already in use.`)
      if (typeof port === 'string' || port >= portRange) {
        return process.exit(1)
      }
      console.log(`Incrementing to port ${++port} and trying again.`)
      server.listen(port)
      break
    default:
      throw error
  }
}

function onListening () {
  const addr = server.address()
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port
  console.log(`Listening on ${bind}.`)
}

module.exports = app
