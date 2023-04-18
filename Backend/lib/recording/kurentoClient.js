const kurentoClient = require('kurento-client')
const kurentoMediaServerUrl = process.env.KURENTO_CLIENT_URL

const startRecording = async (producers,transport) => {
  const kurentoPipeline = await kurentoClient(kurentoMediaServerUrl).create('MediaPipeline')
  const kurentoWebRtcEndpoint = await kurentoPipeline.create('WebRtcEndpoint')
  const kurentoFileRecorder = await kurentoPipeline.create('RecorderEndpoint', {
    uri: 'file:///path/to/recordings/file.webm',
  })

  for (const producer of producers) {
    const { id, kind, rtpParameters } = producer
    const consumer = await worker.createConsumer(producer.transport, { producerId: id, rtpParameters })
    const incomingStream = await kurentoWebRtcEndpoint.getIncomingStreams()
    await consumer.resume(incomingStream[0])
  }

  kurentoWebRtcEndpoint.connect(kurentoFileRecorder)
  kurentoFileRecorder.record()
}

module.exports = {}
