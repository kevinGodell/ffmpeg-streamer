'use strict'

const express = require('express')
const router = express.Router()
const os = require('os')

router.use('/', (req, res) => {
  const app = req.app
  let response = `<p>${app.get('dirName')}</p><p>${app.get('ffmpegVersion')}</p><p>${app.get('ffmpegPath')}</p>`
  response += `<p>${os.arch()}</p>`
  response += `<p>${os.cpus().length}</p>`
  response += `<p>${os.freemem}</p>`
  response += `<p>${os.loadavg()}</p>`
  response += `<p>${os.platform()}</p>`
  response += `<p>${os.release}</p>`
  response += `<p>${os.uptime}</p>`
  response += `<p>${os.userInfo}</p>`
  response += `<p>${os.endianness()}</p>`
  response += `<p>${os.homedir}</p>`
  response += `<p>${os.hostname}</p>`
  response += `<p>${os.tmpdir()}</p>`
  response += `<p>${os.type}</p>`
  response += `<p>${os.totalmem}</p>`
  response += `<p>${(os.freemem - os.totalmem) / os.totalmem}</p>`
  response += `<p>${os.freemem / os.totalmem}</p>`
  res.status(200).send(response)
})

module.exports = router
