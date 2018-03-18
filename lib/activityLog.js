'use strict'

const fs = require('fs')
const path = require('path')

function ActivityLogInit (dir) {
  if (!dir) {
    console.error('Must include dir')
    return {}
  }

  return ActivityLog.config(dir)
}

const ActivityLog = {

  config (dir) {
    this._pathToFile = path.resolve(path.join(dir, '/ffmpeg-streamer-activity.json'))

    this._running = fs.existsSync(this._pathToFile)

    this._activity = this._activityFromFile

    return this
  },

  create () {
    try {
      fs.writeFileSync(this._pathToFile, JSON.stringify([]))
      this._running = true
    } catch (err) {
      console.error(err.message)
      this._running = false
    }

    this._activity = []

    return this
  },

  destroy () {
    try {
      fs.unlinkSync(this._pathToFile)
    } catch (err) {
      console.warn(err.message)
    }

    this._running = false

    this._activity = []

    return this
  },

  add (data) {
    if (!this._running) {
      console.warn('Activity logging is not active')
      return
    }

    if (!data) {
      console.warn('Must pass a data object')
      return
    }

    this._activity = this._activityFromFile

    this._activity.push(data)

    while (this._activity.length > 1) {
      this._activity.shift()
    }

    try {
      fs.writeFileSync(this._pathToFile, JSON.stringify(this._activity))
    } catch (err) {
      console.warn(err.message)
      this._running = false
    }

    return this
  },

  remove (index) {
    if (!this.running) {
      console.warn('Activity logging is not active')
      return
    }

    if (typeof index === 'undefined' || isNaN(index)) {
      console.warn('Must pass an array index')
      return
    }

    if (!(index in this._activity)) {
      console.warn('Index not in array')
      return
    }

    this._activity = this._activityFromFile

    this._activity.splice(index, 1)

    try {
      fs.writeFileSync(this._pathToFile, JSON.stringify(this._activity))
    } catch (err) {
      console.warn(err.message)
      this._running = false
    }

    return this
  },

  get running () {
    return this._running
  },

  get activity () {
    return this._activity
  },

  get lastActivity () {
    if (!this._activity.length) {
      return null
    }
    return this._activity[this._activity.length - 1]
  },

  get _activityFromFile () {
    try {
      const data = fs.readFileSync(this._pathToFile)
      const jsonData = JSON.parse(data)

      if (Array.isArray(jsonData)) {
        return jsonData
      } else {
        return []
      }
    } catch (err) {
      // console.log(err.message);
      return []
    }
  }

}

module.exports = ActivityLogInit
