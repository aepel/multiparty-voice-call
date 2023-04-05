const startRecording = async (stream, transport, router) => {
  const audioProducer = await transport.produce({
    kind: 'audio',
    rtpParameters: await router.createRtpParameters('audio', { codecs: mediaCodecs }),
  })
  const videoProducer = await transport.produce({
    kind: 'video',
    rtpParameters: await router.createRtpParameters('video', { codecs: mediaCodecs }),
  })
  stream = await router.createStream({ audioProducerId: audioProducer.id, videoProducerId: videoProducer.id })
}
const disconnect = async (producer, transport) => {
  console.log('user disconnected')
  try {
    if (producer) {
      await producer.close()
    }
    if (transport) {
      await transport.close()
    }
  } catch (ex) {
    console.error(ex)
  }
}
const stopRecording = async stream => {
  const file = `./public/recordings/${Date.now()}.webm`
  const video = stream.getConsumers().find(consumer => consumer.kind === 'video')
  const audio = stream.getConsumers().find(consumer => consumer.kind === 'audio')
  const videoStream = await video.createStream()
  const audioStream = await audio.createStream()
  const recorder = new mediasoup.Recorder({ ffmpegCommand: 'ffmpeg' })
  await recorder.init({ videoStream, audioStream })
  await recorder.start({ path: file })
  setTimeout(async () => {
    await recorder.stop()
    console.log(`File saved to ${file}`)
  }, 10000)
}

module.exports = {
  startRecording,
  stopRecording,
  disconnect,
}
