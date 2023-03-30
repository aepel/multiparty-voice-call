const mediasoup = require('mediasoup')
const config = require('../config')
const { v4: uuidv4 } = require('uuid')
const ffmpeg = require('../recording/ffmpeg')
// Set up the mediasoup server and create a router
const setUpMediaSoupServer = async () => {
  console.log('Set up Mediasoup server')
  const mediasoupWorker = await mediasoup.createWorker()
  const mediaCodecs = config.mediasoup.routerOptions.mediaCodecs
  const router = await mediasoupWorker.createRouter({ mediaCodecs })
  return router
}

// const createWorker = async () => {
//   worker = await mediasoup.createWorker(config.workerOptions)
//   console.log(`worker pid ${worker.pid}`)

//   worker.on('died', error => {
//     // This implies something serious happened, so kill the application
//     console.error('mediasoup worker has died')
//     setTimeout(() => process.exit(1), 2000) // exit in 2 seconds
//   })

//   return worker
// }

// const createTransport = async (data, callback, router, transport) => {
//   try {
//     // const sessionId = uuidv4()
//     // socket.sessionId = sessionId
//     // const peer = new Peer(sessionId)
//     // peers.set(sessionId, peer)
//     let sessionId = uuidv4()
//     transport = await router.createWebRtcTransport({
//       listenIps: [{ ip: '0.0.0.0', announcedIp: data.ip }],
//       enableUdp: true,
//       enableTcp: true,
//       preferUdp: true,
//       sessionId,
//     })
//     transport.on('dtlsstatechange', dtlsState => {
//       if (dtlsState === 'closed') {
//         transport.close()
//       }
//     })
//     callback({
//       transportId: transport.id,
//       id: transport.id,
//       iceParameters: transport.iceParameters,
//       iceCandidates: transport.iceCandidates,
//       dtlsParameters: transport.dtlsParameters,
//       routerRtpCapabilities: router.routerRtpCapabilities,

//       sessionId,
//     })
//   } catch (error) {
//     console.error(error)
//     callback({ error: error.message })
//   }
//   return transport
// }
// const connectTransport = async (data, callback, transport) => {
//   try {
//     if (transport) {
//       console.log('Transport %s Connected', transport.id)

//       await transport.connect({
//         dtlsParameters: transport.dtlsParameters,
//       })
//       console.log('Transport %s Connected', transport.id)
//       if (callback) callback('success')
//     }
//   } catch (error) {
//     console.error(error)
//     if (callback) callback({ error: error.message })
//   }
// }
// const createProducer = async (data, callback, transport, producer) => {
//   console.log('🚀 ~ file: index.js:55 ~ createProducer ~ createProducer:')
//   try {
//     const { kind, rtpParameters } = data
//     producer = await transport.produce({
//       kind,
//       rtpParameters,
//     })
//     callback({ producerId: producer.id })
//   } catch (error) {
//     console.error(error)
//     callback({ error: error.message })
//   }
// }
// const createConsumer = async (data, callback, transport, producer, socket) => {
//   console.log('🚀 ~ file: index.js:69 ~ createConsumer ~ createConsumer:')
//   try {
//     const { producerId, rtpCapabilities } = data
//     const consumer = await transport.consume({
//       producerId,
//       rtpCapabilities,
//     })
//     callback({
//       consumerId: consumer.id,
//       producerId: producer.id,
//       kind: consumer.kind,
//       rtpParameters: consumer.rtpParameters,
//       type: consumer.type,
//     })
//     const stream = consumer.createStream()

//     socket.emit('newConsumer', { consumerId: consumer.id })
//   } catch (error) {
//     console.error(error)
//     callback({ error: error.message })
//   }
// }

// const recordVideo = async ({ kind, rtpParameters }, callback) => {
//   // Listen for incoming media from the client

//   const producer = await webRtcTransport.produce({ kind, rtpParameters })
//   console.log(`Producer created for ${kind} with ID ${producer.id}`)

//   // Send the producer ID to the client
//   callback({ id: producer.id })

//   // Consume the media sent by the client
//   const consumer = await webRtcTransport.consume({ producerId: producer.id })
//   console.log(`Consumer created for ${kind} with ID ${consumer.id}`)

//   // Record the stream to a file using FFmpeg
//   ffmpeg(consumer.createReadableStream())
// }
// module.exports = {
//   createWorker,
//   setUpMediaSoupServer,
//   createConsumer,
//   createProducer,
//   connectTransport,
//   createTransport,
//   recordVideo,
// }

console.log('mediasoup loaded [version:%s]', mediasoup.version)

let workers = []
let nextWorkerIndex = 0

// Start the mediasoup workers
async function createWorkers() {
  const { logLevel, logTags, rtcMinPort, rtcMaxPort } = config.workerOptions

  console.log('initializeWorkers() creating %d mediasoup workers', config.numWorkers)

  for (let i = 0; i < config.numWorkers; ++i) {
    const worker = await mediasoup.createWorker({
      logLevel,
      logTags,
      rtcMinPort,
      rtcMaxPort,
    })

    worker.once('died', () => {
      console.error('worker::died worker has died exiting in 2 seconds... [pid:%d]', worker.pid)
      setTimeout(() => process.exit(1), 2000)
    })

    workers.push(worker)
  }
}

async function createRouter() {
  const worker = getNextWorker()

  console.log('createRouter() creating new router [worker.pid:%d]', worker.pid)

  console.log(`config.router.mediaCodecs:${JSON.stringify(config.routerOptions.mediaCodecs)}`)

  return await worker.createRouter({ mediaCodecs: config.routerOptions.mediaCodecs })
}

async function createTransport(transportType, router, options) {
  console.log('createTransport() [type:%s. options:%o]', transportType, options)

  switch (transportType) {
    case 'webRtc':
      return await router.createWebRtcTransport(config.webRtcTransport)
    case 'plain':
      return await router.createPlainRtpTransport(config.plainRtpTransport)
  }
}

const getNextWorker = () => {
  const worker = workers[nextWorkerIndex]

  if (++nextWorkerIndex === workers.length) {
    nextWorkerIndex = 0
  }

  return worker
}
module.exports = {
  createWorkers,
  setUpMediaSoupServer,
  createRouter,
  createTransport,
  //   createProducer,
  //   connectTransport,
  //   createTransport,
  //   recordVideo,
}
