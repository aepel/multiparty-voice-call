
const ffmpeg = require('fluent-ffmpeg')
const { StreamInput } = require('fluent-ffmpeg-multistream')
const fs = require('fs')

const { Server } = require('socket.io')
const Peer = require('../helpers/peer')
const { startRecording, stopRecording, disconnect } = require('../recording')
const { v4: uuidv4 } = require('uuid')
const Room = require('../helpers/room')
const _ = require('lodash')
const peers = {}
const rooms = {}
const path = require('path')
module.exports = async (server, createRouterFromPoolFunction) => {
  const io = new Server(server, {
    cors: {
      origin: ['*', 'https://localhost:3033'],
    },
  })

  // Set up the socket.io connection

  io.on('connection', async socket => {
    console.log('🚀 ~ file: index.js:217 ~ socket:', socket.id)
    socket.emit('connection-success', { socketId: socket.id })
    socket.on('joinRoom', async ({ roomName }, callback) => {
      // create Router if it does not exist
      // const router1 = rooms[roomName] && rooms[roomName].get('data').router || await createRoom(roomName, socket.id)
      const router1 = await createRoom(roomName, socket)

      // get Router RTP Capabilities
      const rtpCapabilities = router1.rtpCapabilities

      // call callback from the client and send back the rtpCapabilities
      callback({ rtpCapabilities })
    })
    socket.on('getProducers', callback => {
      //return all producer transports
      const { roomName } = peers[socket.id]

      //return all producer transports

      let producerList = rooms[roomName].producers
        .filter(producer => producer.socketId !== socket.id)
        .map(producerData => producerData.id)

      // return the producer list back to the client
      callback(producerList)
    })
    const informConsumers = (roomName, socketId, id, socket) => {
      console.log(`just joined, id ${id} ${roomName}, ${socketId}`)
      _.forEach(
        (rooms[roomName].producers || []).filter(producerData => producerData.socketId !== socketId),
        ({ socketId: producerSocketId, id: producerId }) => {
          try {
            const producerSocket = peers[producerSocketId].socket
            // use socket to send producer id to producer
            producerSocket.emit('new-producer', { producerId: id })
          } catch (ex) {
            rooms[roomName].removeProducers([producerId])
          }
        }
      )
    }
    //When the client socket is disconnected
    socket.on('disconnect', async () => {
      console.log('peer disconnected', socket.id, peers.length)
      const { roomName } = peers[socket.id] || {}
      if (peers[socket.id] && rooms[roomName]) {
        rooms[roomName].producer?.find(prod => prod.socketId === socket.id).forEach(disconnect)
        rooms[roomName].consumer?.find(prod => prod.socketId === socket.id).forEach(disconnect)
        rooms[roomName].removeProducers(rooms[roomName].producer?.find(prod => prod.socketId === socket.id))
        peers[socket.id].getTransports()?.forEach(trans => disconnect(null, trans))
        delete peers[socket.id]
        console.log('peer disconnected')
      }
    })



    // Client emits a request to create server side Transport
    // We need to differentiate between the producer and consumer transports
    socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
      console.log(`Is this a consumer request? ${consumer}`)
      // The client indicates if it is a producer or a consumer
      // if sender is true, indicates a producer else a consumer
      // get Room Name from Peer's properties
      const { roomName } = peers[socket.id]

      // get Router (Room) object this peer is in based on RoomName
      const router = rooms[roomName].getRouter()

      producerTransport = await createWebRtcTransport(callback, router)
      producerTransport.consumer = consumer
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
      console.log('***************************Socket/producer', socket.id, producer.id)
      rooms[roomName].addProducer(producer, socket.id)
      console.log('Producer ID: ', producer.id, producer.kind)
      informConsumers(roomName, socket.id, producer.id, socket)
     
      producer.on('transportclose', () => {
        console.log('transport for this producer closed ')
        producer.close()
      })

      // Send back to the client the Producer's id
      callback({
        id: producer.id,
        producersExist: rooms[roomName].producers.length > 1,
      })
    })

    // see client's socket.emit('transport-recv-connect', ...)
    socket.on('transport-recv-connect', async ({ dtlsParameters, serverConsumerTransportId: transportId }) => {
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
        const router = rooms[roomName].getRouter()
        // check if the router can consume the specified producer
        if (
          router.canConsume({
            producerId: remoteProducerId,
            rtpCapabilities,
          })
        ) {
          // transport can now consume and return a consumer
          consumer = await peers[socket.id].getConsumerTransport(serverConsumerTransportId).consume({
            producerId: remoteProducerId,
            rtpCapabilities,
            paused: true,
          })

          rooms[roomName].addConsumer(consumer, socket.id)

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
            producerId: remoteProducerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
          }

          // send the parameters to the client
          callback({ params })
        }
      } catch (error) {
        callback({
          params: {
            error: error,
          },
        })
        throw error
      }
    })

    socket.on('consumer-resume', async ({ serverConsumerId }) => {
      console.log('consumer resume')
      const { roomName } = peers[socket.id]
      const consumer = rooms[roomName].consumers[serverConsumerId]
      await consumer?.resume()
    })
  })

  const createWebRtcTransport = async (callback, router) => {
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

  const createRoom = async (roomName, socket) => {
    
    const socketId = socket.id
    if (!rooms[roomName]) {
      let router = await createRouterFromPoolFunction()
      rooms[roomName] = new Room(router, roomName)
    }
    if (!rooms[roomName].getPeer(socketId)) {
      rooms[roomName].addPeer(new Peer(socket, roomName))
    }
    peers[socketId] = rooms[roomName].getPeer(socketId)
    let router1 = rooms[roomName].getRouter()
    console.log(`Router ID: ${router1.id}`)

    return router1
  }
}
