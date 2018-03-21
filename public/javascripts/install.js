'use strict';

(function init() {
  var message = document.getElementById('message');

  var progressbar = document.getElementById('progressbar');

  var installSocket = window.io.connect(window.location.origin + '/install', {

    transports: ['websocket'],

    forceNew: false,

    reconnection: true,

    reconnectionDelay: 500

  });

  installSocket.on('connect_failed', function () {
    message.innerText = 'Socket Connection failed.';
  });

  /*
  installSocket.on('disconnect', () => {
    message.innerText = 'Socket Disconnect.';
  })
  */

  installSocket.on('error', function () {
    message.innerText = 'Socket Error.';
  });

  installSocket.on('connect', function () {
    var button = document.getElementById('install');

    installSocket.on('status', function (data) {
      switch (data.type) {
        case 'downloading':

          message.innerText = 'Downloading...';

          progressbar.style.display = 'inline';

          break;

        case 'fail':

          message.innerText = 'Fail: ' + data.msg;

          progressbar.style.display = 'none';

          installSocket.disconnect();

          break;

        case 'complete':

          message.innerText = 'Complete';

          progressbar.style.display = 'none';

          installSocket.disconnect();

          window.location.replace('/');

          break;
      }
    });

    button.addEventListener('click', function () {
      installSocket.emit('download');
    });
  });
})();

//# sourceMappingURL=install.js.map