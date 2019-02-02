'use strict'

const express = require('express')
const router = express.Router()
const os = require('os')
const util = require('util')

router.use('/', (req, res) => {
  const app = req.app
  let response = `<p>${app.get('dirName')}</p>
  <p>${app.get('ffmpegVersion')}</p>
  <p>${app.get('ffmpegPath')}</p>
  <p>${os.arch()}</p>
  <p>${os.cpus().length}</p>
  <p>${os.freemem}</p>
  <p>${os.loadavg()}</p>
  <p>${os.platform()}</p>
  <p>${os.release}</p>
  <p>${os.uptime}</p>
  <p>${util.inspect(os.userInfo())}</p>
  <p>${os.endianness()}</p>
  <p>${os.homedir}</p>
  <p>${os.hostname}</p>
  <p>${os.tmpdir()}</p>
  <p>${os.type}</p>
  <p>${os.totalmem}</p>
  <p>${(os.freemem - os.totalmem) / os.totalmem}</p>
  <p>${os.freemem / os.totalmem}</p>`
  res.status(200).send(response)
})

module.exports = router
