'use strict'

const express = require('express')
const router = express.Router()

router.use('/', (req, res) => {
  const app = req.app
  res.status(200).send(`<p>${app.get('dirName')}</p><p>${app.get('ffmpegVersion')}</p><p>${app.get('ffmpegPath')}</p>`)
})

module.exports = router
