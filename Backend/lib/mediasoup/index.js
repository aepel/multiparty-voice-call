const mediasoup = require('mediasoup')
const config = require('../config')
const { v4: uuidv4 } = require('uuid')
const ffmpeg = require('../recording/ffmpeg')
// Set up the mediasoup server and create a router
const setUpMediaSoupServer = async () => {
  const mediasoupWorker = await mediasoup.createWorker()
  const mediaCodecs = config.mediasoup.routerOptions.mediaCodecs
  const router = await mediasoupWorker.createRouter({ mediaCodecs })
  return router
}

const createTransport = async (data, callback, router, transport) => {
  console.log('🚀 ~ file: index.js:14 ~ createTransport ~ createTransport:', data)
  try {
    const sessionId = uuidv4()
    socket.sessionId = sessionId
    const peer = new Peer(sessionId)
    peers.set(sessionId, peer)
    transport = await router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: data.ip }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      sessionId,
    })
    callback({
      transportId: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      sessionId,
    })
  } catch (error) {
    console.error(error)
    callback({ error: error.message })
  }
  return transport
}
const connectTransport = async (data, callback, transport) => {
  console.log('Transport Connected', data)

  try {
    await transport.connect({
      dtlsParameters: data.dtlsParameters,
    })
    callback('success')
  } catch (error) {
    console.error(error)
    callback({ error: error.message })
  }
}
const createProducer = async (data, callback, transport, producer) => {
  try {
    const { kind, rtpParameters } = data
    producer = await transport.produce({
      kind,
      rtpParameters,
    })
    callback({ producerId: producer.id })
  } catch (error) {
    console.error(error)
    callback({ error: error.message })
  }
}
const createConsumer = async (data, callback, transport, producer, socket) => {
  try {
    const { producerId, rtpCapabilities } = data
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
    })
    callback({
      consumerId: consumer.id,
      producerId: producer.id,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      type: consumer.type,
    })
    const stream = consumer.createStream()

    socket.emit('newConsumer', { consumerId: consumer.id })
  } catch (error) {
    console.error(error)
    callback({ error: error.message })
  }
}

const recordVideo = async ({ kind, rtpParameters }, callback) => {
  // Listen for incoming media from the client

  const producer = await webRtcTransport.produce({ kind, rtpParameters })
  console.log(`Producer created for ${kind} with ID ${producer.id}`)

  // Send the producer ID to the client
  callback({ id: producer.id })

  // Consume the media sent by the client
  const consumer = await webRtcTransport.consume({ producerId: producer.id })
  console.log(`Consumer created for ${kind} with ID ${consumer.id}`)

  // Record the stream to a file using FFmpeg
  ffmpeg(consumer.createReadableStream())
}
module.exports = {
  setUpMediaSoupServer,
  createConsumer,
  createProducer,
  connectTransport,
  createTransport,
  recordVideo,
}
