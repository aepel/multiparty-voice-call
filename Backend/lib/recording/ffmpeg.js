// Create a mediasoup consumer for the stream
//const consumer = await transport.consume({ producerId });
//const stream = consumer.createReadableStream();
const ffmpeg = require('fluent-ffmpeg')
module.exports = stream => {
  ffmpeg(stream)
    .outputOptions(['-preset ultrafast'])
    .format('mp4')
    .output('output.mp4')
    .on('error', err => {
      console.error(`Error recording stream: ${err}`)
    })
    .on('end', () => {
      console.log('Recording complete!')
    })
    .run()
}
// Record the stream to a file using FFmpeg
