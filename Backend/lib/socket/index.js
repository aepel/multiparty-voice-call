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
const Peer = require('../helpers/peer')
const { startRecording, stopRecording, disconnect } = require('../recording')
const { v4: uuidv4 } = require('uuid')
const Room = require('../helpers/room')

const peers = {}
const rooms = {}
module.exports = async server => {
  const io = new Server(server, {
    cors: {
      origin: ['*', 'https://localhost:3033', 'https://172.27.250.147:3033'],
    },
  })

  // Set up the socket.io connection

  io.on('connection', async socket => {
    console.log('🚀 ~ file: index.js:217 ~ socket:', socket.id)
    socket.emit('socket-connected', { socketId: socket.id })

    socket.on('getProducers', callback => {
      //return all producer transports
      const peer = peers[socket.id]

      //return all producer transports

      let producerList = peer
        .getProducers()
        //.filter(producerData => producerData.socketId !== socket.id && producerData.roomName === peer.roomName)
        .map(producerData => producerData.id)

      // return the producer list back to the client
      callback(producerList)
    })
    const informConsumers = (roomName, socketId, id, socket) => {
      console.log(`just joined, id ${id} ${roomName}, ${socketId}`)
      socket.emit('new-producer', { producerId: id })
      // A new producer just joined
      // let all consumers to consume this producer
      // rooms[roomName].getPeer(socketId).getSocket().emit('new-producer', { producerId: id })
      // .getProducers()
      // .forEach(producerData => {
      //   if (producerData.socketId !== socketId && producerData.roomName === roomName) {
      //     const producerSocket = peers[producerData.socketId].socket
      //     // use socket to send producer id to producer
      //     producerSocket.emit('new-producer', { producerId: id })
      //   }
      // })
    }
    //When the client socket is disconnected
    socket.on('disconnect', async () => {
      const peer = peers[socket.id]
      if (peer) {
        peer.getProducers().forEach(disconnect)

        peer.getTransports().forEach(trans => disconnect(null, trans))
        delete peers[socket.id]
        console.log('peer disconnected')
      }
    })
    socket.on('joinRoom', async ({ roomName }, callback) => {
      console.log('🚀 ~ file: index.js:83 ~ socket.on ~ roomName:', roomName)

      // create Router if it does not exist
      // const router1 = rooms[roomName] && rooms[roomName].get('data').router || await createRoom(roomName, socket.id)
      const router1 = await createRoom(roomName, socket.id)

      // get Router RTP Capabilities
      const rtpCapabilities = router1.rtpCapabilities

      // call callback from the client and send back the rtpCapabilities
      callback({ rtpCapabilities })
    })
    // router = await createRouter()
    // Client emits a request for RTP Capabilities
    // This event responds to the request
    socket.on('getRtpCapabilities', async callback => getRtpCapabilities(callback, sessionId))

    // Client emits a request to create server side Transport
    // We need to differentiate between the producer and consumer transports
    socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
      console.log(`Is this a consumer request? ${consumer}`)
      // The client indicates if it is a producer or a consumer
      // if sender is true, indicates a producer else a consumer
      // get Room Name from Peer's properties
      console.log('🚀 ~ file: index.js:85 ~ socket.on ~ peers[socket.id]:', peers, peers[socket.id])
      const roomName = peers[socket.id].roomName

      // get Router (Room) object this peer is in based on RoomName
      const router = rooms[roomName].router

      producerTransport = await createWebRtcTransport(callback)
      peers[socket.id].addTransport(producerTransport)
    })

    // see client's socket.emit('transport-connect', ...)
    socket.on('transport-connect', async ({ dtlsParameters, transportId }) => {
      console.log('DTLS PARAMS... ', { dtlsParameters })
      const peer = peers[socket.id]
      let producerTransport = peer.getTransport(transportId)

      try {
        await producerTransport.connect({ dtlsParameters })
        console.debug('producerTransport connected')
      } catch (ex) {
        console.error('', ex)
      }
    })

    // see client's socket.emit('transport-produce', ...)
    socket.on('transport-produce', async ({ kind, rtpParameters, appData, transportId }, callback) => {
      // call produce based on the prameters from the client
      let producerTransport = peers[socket.id].getTransport(transportId)
      let producer = await producerTransport.produce({
        kind,
        rtpParameters,
      })
      const { roomName } = peers[socket.id]

      peers[socket.id].addProducer(producer)
      console.log('Producer ID: ', producer.id, producer.kind)
      informConsumers(roomName, socket.id, producer.id, socket)

      producer.on('transportclose', () => {
        console.log('transport for this producer closed ')
        producer.close()
      })

      // Send back to the client the Producer's id
      callback({
        id: producer.id,
        producersExist: peers[socket.id].getProducers().length > 1,
      })
    })

    // see client's socket.emit('transport-recv-connect', ...)
    socket.on('transport-recv-connect', async ({ dtlsParameters, transportId }) => {
      console.log(`DTLS PARAMS: ${dtlsParameters}`)
      try {
        let consumerTransport = peers[socket.id].getTransport(transportId)
        await consumerTransport.connect({ dtlsParameters })
        consumerTransport.connected = true
        console.log('Consumer transport connected')
      } catch (ex) {
        console.error('', ex)
      }
    })

    socket.on('consume', async ({ rtpCapabilities, remoteProducerId, serverConsumerTransportId }, callback) => {
      try {
        const { roomName } = peers[socket.id]
        const router = rooms[roomName].router
        // check if the router can consume the specified producer
        if (
          router.canConsume({
            producerId: remoteProducerId,
            rtpCapabilities,
          })
        ) {
          // transport can now consume and return a consumer
          consumer = await peers[socket.id].getTransport(serverConsumerTransportId).consume({
            producerId: remoteProducerId,
            rtpCapabilities,
            paused: true,
          })
          console.log('🚀 ~ file: index.js:108 ~ socket.on ~ consume- IT WORKS')

          peers[socket.id].addConsumer(consumer)

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
            producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
          }

          // send the parameters to the client
          callback({ params })
        }
      } catch (error) {
        console.error('****************************')
        console.error(error.message)
        callback({
          params: {
            error: error,
          },
        })
      }
    })

    socket.on('consumer-resume', async ({ serverConsumerId }) => {
      console.log('consumer resume')
      const { consumer } = consumers.find(consumerData => consumerData.consumer.id === serverConsumerId)
      await consumer.resume()
    })
  })

  const createWebRtcTransport = async (router, callback) => {
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

  const createRoom = async (roomName, socketId) => {
    // worker.createRouter(options)
    // options = { mediaCodecs, appData }
    // mediaCodecs -> defined above
    // appData -> custom application data - we are not supplying any
    // none of the two are required
    let router1
    let peers = []
    if (!rooms[roomName]) {
      router1 = await worker.createRouter({ mediaCodecs })
      rooms[roomName] = new Room(router1, roomName)
      rooms[roomName].addPeer(new Peer(socketId, roomName))
      peers[socketId] = new Peer(socketId, roomName)
    }

    console.log(`Router ID: ${router1.id}`, peers.length)

    return router1
  }
}
