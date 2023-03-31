const {
  setUpMediaSoupServer,
  createConsumer,
  createProducer,
  createTransport,
  connectTransport,
  recordVideo,
  createRouter,
} = require('../mediasoup')
const { Server } = require('socket.io')

const { startRecording, stopRecording, disconnect } = require('../recording')
const { v4: uuidv4 } = require('uuid')
let producerTransport
let consumerTransport
let producer
let consumer
module.exports = async server => {
  const io = new Server(server, {
    cors: {
      origin: ['*', 'https://localhost:3033', 'https://172.27.250.147:3033'],
    },
  })

  // Set up the socket.io connection

  io.on('connection', async socket => {
    socket.emit('socket-connected', { socketId: socket.id })

    //When the client socket is disconnected
    socket.on('disconnect', async () => {
      await disconnect(producer, producerTransport)
      console.log('peer disconnected')
    })

    router = await createRouter()
    // Client emits a request for RTP Capabilities
    // This event responds to the request
    socket.on('getRtpCapabilities', callback => {
      console.log('router.rtpCapabilities', router.rtpCapabilities)
      const rtpCapabilities = router.rtpCapabilities

      console.log('rtp Capabilities', rtpCapabilities)

      // call callback from the client and send back the rtpCapabilities
      callback({ rtpCapabilities })
    })

    // Client emits a request to create server side Transport
    // We need to differentiate between the producer and consumer transports
    socket.on('createWebRtcTransport', async ({ sender }, callback) => {
      console.log(`Is this a sender request? ${sender}`)
      // The client indicates if it is a producer or a consumer
      // if sender is true, indicates a producer else a consumer
      if (sender) producerTransport = await createWebRtcTransport(callback)
      else consumerTransport = await createWebRtcTransport(callback)
    })

    // see client's socket.emit('transport-connect', ...)
    socket.on('transport-connect', async ({ dtlsParameters }) => {
      console.log('DTLS PARAMS... ', { dtlsParameters })
      await producerTransport.connect({ dtlsParameters })
    })

    // see client's socket.emit('transport-produce', ...)
    socket.on('transport-produce', async ({ kind, rtpParameters, appData }, callback) => {
      // call produce based on the prameters from the client
      producer = await producerTransport.produce({
        kind,
        rtpParameters,
      })

      console.log('Producer ID: ', producer.id, producer.kind)

      producer.on('transportclose', () => {
        console.log('transport for this producer closed ')
        producer.close()
      })

      // Send back to the client the Producer's id
      callback({
        id: producer.id,
      })
    })

    // see client's socket.emit('transport-recv-connect', ...)
    socket.on('transport-recv-connect', async ({ dtlsParameters }) => {
      console.log(`DTLS PARAMS: ${dtlsParameters}`)
      await consumerTransport.connect({ dtlsParameters })
    })

    socket.on('consume', async ({ rtpCapabilities }, callback) => {
      try {
        // check if the router can consume the specified producer
        if (
          router.canConsume({
            producerId: producer.id,
            rtpCapabilities,
          })
        ) {
          // transport can now consume and return a consumer
          consumer = await consumerTransport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: true,
          })

          consumer.on('transportclose', () => {
            console.log('transport close from consumer')
          })

          consumer.on('producerclose', () => {
            console.log('producer of consumer closed')
          })

          // from the consumer extract the following params
          // to send back to the Client
          const params = {
            id: consumer.id,
            producerId: producer.id,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
          }

          // send the parameters to the client
          callback({ params })
        }
      } catch (error) {
        console.log(error.message)
        callback({
          params: {
            error: error,
          },
        })
      }
    })

    socket.on('consumer-resume', async () => {
      console.log('consumer resume')
      await consumer.resume()
    })
  })

  const createWebRtcTransport = async callback => {
    try {
      // https://mediasoup.org/documentation/v3/mediasoup/api/#WebRtcTransportOptions
      const webRtcTransport_options = {
        listenIps: [
          {
            ip: '0.0.0.0', // replace with relevant IP address
            announcedIp: '172.27.250.147',
          },
        ],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true,
      }

      // https://mediasoup.org/documentation/v3/mediasoup/api/#router-createWebRtcTransport
      let transport = await router.createWebRtcTransport(webRtcTransport_options)
      console.log(`transport id: ${transport.id}`)

      transport.on('dtlsstatechange', dtlsState => {
        if (dtlsState === 'closed') {
          transport.close()
        }
      })

      transport.on('close', () => {
        console.log('transport closed')
      })

      // send back to the client the following prameters
      callback({
        // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
        params: {
          id: transport.id,
          iceParameters: transport.iceParameters,
          iceCandidates: transport.iceCandidates,
          dtlsParameters: transport.dtlsParameters,
        },
      })

      return transport
    } catch (error) {
      console.log(error)
      callback({
        params: {
          error: error,
        },
      })
    }
  }
}
