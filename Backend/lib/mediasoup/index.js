const mediasoup = require('mediasoup')
const config = require('../config')
const { v4: uuidv4 } = require('uuid')

// Set up the mediasoup server and create a router
const setUpMediaSoupServer = async () => {
  console.log('Set up Mediasoup server')
  const mediasoupWorker = await mediasoup.createWorker()
  const mediaCodecs = config.mediasoup.routerOptions.mediaCodecs
  const router = await mediasoupWorker.createRouter({ mediaCodecs })
  return router
}

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

  //   createProducer,
  //   connectTransport,
  //   createTransport,
  //   recordVideo,
}
