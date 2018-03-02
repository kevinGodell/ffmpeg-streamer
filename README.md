# ffmpeg-streamer

**ffmpeg-streamer** is a packaged nodejs [express](https://github.com/expressjs/express) server that wraps `ffmpeg` to allow easy streaming of video feeds directly to ***modern*** browsers for testing purposes.
It currently includes 6 different types of streaming which are *mjpeg*, *jpeg via socket.io*, *progressive mp4*, [*flv.js*](https://github.com/Bilibili/flv.js), [*hls.js*](https://github.com/video-dev/hls.js), and *media source via socket.io*.

### Installation
**ffmpeg-streamer** has been packaged into an executable using [pkg](https://github.com/zeit/pkg).
The current binaries can be found on the [releases](https://github.com/kevinGodell/rtsp-cam-tester/releases) page.
* The Windows binary is already executable and can be run simply by downloading and launching it.
* Linux and Mac installation require the binary to be give executable permissions before it can run.

###### Downloading on Linux
```
wget https://github.com/kevinGodell/rtsp-cam-tester/releases/download/v0.0.4/ip-cam-streamer-linux-x64
```

###### Setting executable permissions on Linux
```
chmod +x ip-cam-streamer-linux-x64
```

### Usage
For desktop usage, double click the executable to run it.
For command line usage on Mac or Linux, the following shows 2 options to run it.

###### Start the app from the command line
```
./ip-cam-streamer-linux-x64
```

###### Start the app from the command line via [pm2](https://github.com/Unitech/pm2)
```
pm2 start ip-cam-streamer-linux-x64
```
After launching, you can use it via the web interface on port 8181.
For example, if your are running it on your current machine, visit it in a ***modern*** browser via [http://localhost:8181](http://localhost:8181).
If port 8181 was already in use, it will keep incrementing the port number by 1 until it finds one available.
You can launch multiple copies of the app up to a total of 10, each listening on its own port.

#### Dependencies
**Ffmpeg** is the only external software required to run the app.
Nodejs is packaged inside the binary and is not need to be installed separately on your system.
When launching the app, it tries to find ffmpeg on your system using [ffbinaries](https://github.com/vot/ffbinaries-node).
If it cannot find ffmpeg, you will be prompted to install it to the current running directory via the web interface on port 8181.
If it does find ffmpeg, but you would like to install a newer version, you can visit [http://localhost:8181/install](http://localhost:8181/install) and force the installation.

#### Development

###### Clone the repo and move into the newly created directory
```
git clone https://github.com/kevinGodell/rtsp-cam-tester.git && cd rtsp-cam-tester
```

###### Install the module dependencies
```
npm install
```

###### Start the app in development mode
```
//mac and linux
npm run dev

//windows
npm run dev-win
```

###### Build the binaries
```
npm run pkg
```

#### Feature requests and problems
If you have an idea for a new feature or have a problem, please do not hesitate to open an [issue](https://github.com/kevinGodell/rtsp-cam-tester/issues).
For problems, please include information about what operating system the app is running on and which operating system and browser you are using to view it.
Any additional details would be helpful.