'use strict'

const ffbinaries = require('ffbinaries')

module.exports = (dir) => {
  let path = null
  let version = null
  const ffmpeg = ffbinaries.locateBinariesSync('ffmpeg', {paths: [dir], ensureExecutable: true}).ffmpeg
  if (ffmpeg && ffmpeg.found) {
    path = ffmpeg.path
    version = ffmpeg.version
  }
  return {
    version: version,
    path: path
  }
}
