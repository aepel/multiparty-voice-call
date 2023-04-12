// // Create a mediasoup consumer for the stream
// //const consumer = await transport.consume({ producerId });
// //const stream = consumer.createReadableStream();
// const ffmpeg = require('fluent-ffmpeg')
// module.exports = stream => {
//   ffmpeg(stream)
//     .outputOptions(['-preset ultrafast'])
//     .format('mp4')
//     .output('output.mp4')
//     .on('error', err => {
//       console.error(`Error recording stream: ${err}`)
//     })
//     .on('end', () => {
//       console.log('Recording complete!')
//     })
//     .run()
// }
// // Record the stream to a file using FFmpeg

// ----
const FFmpegStatic = require('ffmpeg-static')

const Process = require('child_process')
/* FFmpeg recording
 * ================
 *
 * The intention here is to record the RTP stream as is received from
 * the media server, i.e. WITHOUT TRANSCODING. Hence the "codec copy"
 * commands in FFmpeg.
 *
 * ffmpeg \
 *     -nostdin \
 *     -protocol_whitelist file,rtp,udp \
 *     -fflags +genpts \
 *     -i recording/input-vp8.sdp \
 *     -map 0:a:0 -c:a copy -map 0:v:0 -c:v copy \
 *     -f webm -flags +global_header \
 *     -y recording/output-ffmpeg-vp8.webm
 *
 * NOTES:
 *
 * '-map 0:x:0' ensures that one media of each type is used.
 *
 * FFmpeg 2.x (Ubuntu 16.04 "Xenial") does not support the option
 * "protocol_whitelist", but it is mandatory for FFmpeg 4.x (newer systems).
 */

function h264Enabled(rtpCapabilities) {
  const codec = rtpCapabilities.codecs.find(c => c.mimeType === 'video/H264')
  return codec !== undefined
}
function isFFmpegInstalled() {
  // Ensure correct FFmpeg version is installed
  const ffmpegOut = Process.execSync(FFmpegStatic + ' -version', {
    encoding: 'utf8',
  })
  const ffmpegVerMatch = /ffmpeg version (\d+)\.(\d+)\.(\d+)/.exec(ffmpegOut)
  let ffmpegOk = false
  if (ffmpegOut.startsWith('ffmpeg version git')) {
    // Accept any Git build (it's up to the developer to ensure that a recent
    // enough version of the FFmpeg source code has been built)
    ffmpegOk = true
  } else if (ffmpegVerMatch) {
    const ffmpegVerMajor = parseInt(ffmpegVerMatch[1], 10)
    if (ffmpegVerMajor >= 4) {
      ffmpegOk = true
    }
  }

  if (!ffmpegOk) {
    console.error('FFmpeg >= 4.0.0 not found in $PATH; please install it')
    process.exit(1)
  }
}
module.exports = function startRecordingFfmpeg(room_id, stopMediasoupRtpCallback) {
  if (!isFFmpegInstalled()) return
  // Return a Promise that can be awaited
  let recResolve
  const promise = new Promise((res, _rej) => {
    recResolve = res
  })

  const useAudio = true
  const useVideo = true
  const useH264 = h264Enabled(config.mediasoup.rtpCapabilities)

  // const cmdProgram = "ffmpeg"; // Found through $PATH
  const cmdProgram = FFmpegStatic // From package "ffmpeg-static"

  let cmdInputPath = `${__dirname}/input-vp8.sdp`
  let cmdOutputPath = `${__dirname}/${room_id}_output-ffmpeg-vp8-${Date.now()}.webm`
  let cmdCodec = ''
  let cmdFormat = '-f webm -flags +global_header'

  

  if (useAudio) {
    cmdCodec += ' -map 0:a:0 -c:a copy'
  }
  if (useVideo) {
    cmdCodec += ' -map 0:v:0 -c:v copy'

    if (useH264) {
      cmdInputPath = `${__dirname}/recording/input-h264.sdp`
      cmdOutputPath = `${__dirname}/recording/output-ffmpeg-h264.mp4`

      // "-strict experimental" is required to allow storing
      // OPUS audio into MP4 container
      cmdFormat = '-f mp4 -strict experimental'
    }
  }

  // Run process
  const cmdArgStr = [
    '-nostdin',
    '-protocol_whitelist file,rtp,udp',
    // "-loglevel debug",
    // "-analyzeduration 5M",
    // "-probesize 5M",
    '-fflags +genpts',
    `-i ${cmdInputPath}`,
    cmdCodec,
    cmdFormat,
    `-y ${cmdOutputPath}`,
  ]
    .join(' ')
    .trim()

  console.log(`Run command: ${cmdProgram} ${cmdArgStr}`)

  let recProcess = Process.spawn(cmdProgram, cmdArgStr.split(/\s+/))

  recProcess.on('error', err => {
    console.error('Recording process error:', err)
  })

  recProcess.on('exit', (code, signal) => {
    console.log('Recording process exit, code: %d, signal: %s', code, signal)

    stopMediasoupRtpCallback()

    if (!signal || signal === 'SIGINT') {
      console.log('Recording stopped')
    } else {
      console.warn("Recording process didn't exit cleanly, output file might be corrupt")
    }
  })

  // FFmpeg writes its logs to stderr
  recProcess.stderr.on('data', chunk => {
    chunk
      .toString()
      .split(/\r?\n/g)
      .filter(Boolean) // Filter out empty strings
      .forEach(line => {
        console.log(line)
        if (line.startsWith('ffmpeg version')) {
          setTimeout(() => {
            recResolve()
          }, 1000)
        }
      })
  })

  return promise
}
