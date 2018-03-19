// jshint browser: true

(function init () {
  'use strict'

  const message = document.getElementById('message')

  const progressbar = document.getElementById('progressbar')

  const installSocket = window.io.connect(`${window.location.origin}/install`, {

    transports: ['websocket'],

    forceNew: false,

    reconnection: true,

    reconnectionDelay: 500

  })

  installSocket.on('connect_failed', () => {
    message.innerText = 'Socket Connection failed.'
  })

  /*
  installSocket.on('disconnect', () => {
    message.innerText = 'Socket Disconnect.';
  })
  */

  installSocket.on('error', () => {
    message.innerText = 'Socket Error.'
  })

  installSocket.on('connect', () => {
    const button = document.getElementById('install')

    installSocket.on('status', (data) => {
      switch (data.type) {
        case 'downloading':

          message.innerText = 'Downloading...'

          progressbar.style.display = 'inline'

          break

        case 'fail':

          message.innerText = `Fail: ${data.msg}`

          progressbar.style.display = 'none'

          installSocket.disconnect()

          break

        case 'complete':

          message.innerText = 'Complete'

          progressbar.style.display = 'none'

          installSocket.disconnect()

          window.location.replace('/')

          break
      }
    })

    button.addEventListener('click', () => {
      installSocket.emit('download')
    })
  })
})()
