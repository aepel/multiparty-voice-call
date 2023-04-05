const mediasoupClient = require('mediasoup-client')
//const config = require('../config')

module.exports = class Mediasoup {
  constructor(socket, newConsumerEventCallback) {
    this.socket = socket
    this.producers = new Map()
    this.device = null
    this.rtpCapabilities = null
    this.producerTransport = null
    this.consumerTransports = []
    this.consumingTransports = []

    this.newConsumerEventCallback = newConsumerEventCallback
    this.audioProducer = null
    this.videoProducer = null
    this.consumer = null
    this.isProducer = false
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerOptions
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
    this.params = {
      // mediasoup params
      encodings: [
        {
          rid: 'r0',
          maxBitrate: 100000,
          scalabilityMode: 'S1T3',
        },
        {
          rid: 'r1',
          maxBitrate: 300000,
          scalabilityMode: 'S1T3',
        },
        {
          rid: 'r2',
          maxBitrate: 900000,
          scalabilityMode: 'S1T3',
        },
      ],
      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#ProducerCodecOptions
      codecOptions: {
        videoGoogleStartBitrate: 1000,
      },
    }
  }

  getProducersStream() {
    return this.producers
  }
  createDevice = async () => {
    try {
      this.device = new mediasoupClient.Device()

      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
      // Loads the device with RTP capabilities of the Router (server side)

      await this.device.load({
        // see getRtpCapabilities() below
        routerRtpCapabilities: this.rtpCapabilities,
      })
    } catch (error) {
      console.log(error)
      if (error.name === 'UnsupportedError') console.warn('browser not supported')
    }
  }

  joinRoom = roomName => {
    this.socket.emit('joinRoom', { roomName }, async data => {
      console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`)
      // we assign to local variable and will be used when
      // loading the client Device (see createDevice above)
      this.rtpCapabilities = data.rtpCapabilities

      // once we have rtpCapabilities from the Router, create Device
      await this.createDevice()
    })
  }

  getRtpCapabilities = roomName => {
    if (!this.socket.connected || !this.socket.connecting) this.socket.connect()

    // server informs the client of a new producer just joined
    this.socket.on('new-producer', ({ producerId }) => this.signalNewConsumerTransport(producerId))
    // make a request to the server for Router RTP Capabilities
    // see server's socket.on('getRtpCapabilities', ...)
    // the server sends back data object which contains rtpCapabilities
    this.socket.emit('createRoom', { roomName }, data => {
      console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`)

      // we assign to local variable and will be used when
      // loading the client Device (see createDevice above)
      this.rtpCapabilities = data.rtpCapabilities

      // once we have rtpCapabilities from the Router, create Device
      this.createDevice()
    })
  }

  getProducers = () => {
    this.socket.emit('getProducers', producerIds => {
      console.log(producerIds)
      // for each of the producer create a consumer
      // producerIds.forEach(id => signalNewConsumerTransport(id))
      producerIds.forEach(this.signalNewConsumerTransport)
    })
  }

  createSendTransport = localStream => {
    // see server's socket.on('createWebRtcTransport', sender?, ...)
    // this is a call from Producer, so sender = true
    this.socket.emit('createWebRtcTransport', { consumer: false }, async ({ params }) => {
      // The server sends back params needed
      // to create Send Transport on the client side
      if (params.error) {
        console.log(params.error)
        return
      }

      console.log(`createWebRtcTransport params:`, params)

      // creates a new WebRTC Transport to send media
      // based on the server's producer transport params
      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
      this.producerTransport = this.device.createSendTransport(params)

      // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
      // this event is raised when a first call to transport.produce() is made
      // see connectSendTransport() below
      this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-connect', ...)
          await this.socket.emit('transport-connect', {
            dtlsParameters,
            transportId: this.producerTransport.id,
          })

          // Tell the transport that parameters were transmitted.
          callback()
        } catch (error) {
          errback(error)
        }
      })

      this.producerTransport.on('produce', async (parameters, callback, errback) => {
        console.log(parameters)

        try {
          // tell the server to create a Producer
          // with the following parameters and produce
          // and expect back a server side producer id
          // see server's socket.on('transport-produce', ...)
          await this.socket.emit(
            'transport-produce',
            {
              kind: parameters.kind,
              rtpParameters: parameters.rtpParameters,
              appData: parameters.appData,
              transportId: this.producerTransport.id,
            },
            ({ id, producersExist }) => {
              // Tell the transport that parameters were transmitted and provide it with the
              // server side producer's id.
              callback({ id })

              // if producers exist, then join room
              console.log('Transport-produce getProducers', producersExist)
              if (producersExist) this.getProducers()
            }
          )
        } catch (error) {
          errback(error)
        }
      })
      await this.connectSendTransport(localStream)
    })
  }

  connectSendTransport = async stream => {
    // we now call produce() to instruct the producer transport
    // to send media to the Router
    // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
    // this action will trigger the 'connect' and 'produce' events above
    console.log('🚀 ~ file: index.js:137 ~ connectSendTransport ~ producerTransport:', this.producerTransport.id)
    // producer = await producerTransport.produce({
    //   track: stream.getVideoTracks()[0],
    //   ...params,
    // })
    let audioParams = { track: stream.getAudioTracks()[0] }
    let videoParams = { track: stream.getVideoTracks()[0], ...this.params }

    const audioProducer = await this.producerTransport.produce(audioParams)
    const videoProducer = await this.producerTransport.produce(videoParams)

    audioProducer.on('trackended', () => {
      console.log('audio track ended')

      // close audio track
    })

    audioProducer.on('transportclose', () => {
      console.log('audio transport ended')

      // close audio track
    })

    videoProducer.on('trackended', () => {
      console.log('video track ended')

      // close video track
    })

    videoProducer.on('transportclose', () => {
      console.log('video transport ended')

      // close video track
    })
  }

  signalNewConsumerTransport = async remoteProducerId => {
    //check if we are already consuming the remoteProducerId
    if (this.consumingTransports.includes(remoteProducerId)) return
    this.consumingTransports.push(remoteProducerId)

    await this.socket.emit('createWebRtcTransport', { consumer: true }, async ({ params }) => {
      console.log('create receiver')
      // The server sends back params needed
      // to create Send Transport on the client side
      if (params.error) {
        console.log(params.error)
        return
      }
      let consumerTransport
      // creates a new WebRTC Transport to receive media
      // based on server's consumer transport params
      // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-createRecvTransport
      try {
        consumerTransport = this.device.createRecvTransport({ ...params })
      } catch (error) {
        // exceptions:
        // {InvalidStateError} if not loaded
        // {TypeError} if wrong arguments.
        console.log(error)
        return
      }
      // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
      // this event is raised when a first call to transport.produce() is made
      // see connectRecvTransport() below
      consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          // Signal local DTLS parameters to the server side transport
          // see server's socket.on('transport-recv-connect', ...)
          await this.socket.emit('transport-recv-connect', {
            dtlsParameters,
            serverConsumerTransportId: params.id,
          })

          console.log('*****************************Connect')
          // Tell the transport that parameters were transmitted.
          callback()
        } catch (error) {
          // Tell the transport that something was wrong
          errback(error)
        }
      })
      console.log('*****************************Connect called********************')

      await this.connectRecvTransport(consumerTransport, remoteProducerId, params.id)
    })
  }

  connectRecvTransport = async (consumerTransport, remoteProducerId, serverConsumerTransportId) => {
    console.log('connect Recv emitting consume')
    // for consumer, we need to tell the server first
    // to create a consumer based on the rtpCapabilities and consume
    // if the router can consume, it will send back a set of params as below

    await this.socket.emit(
      'consume',
      {
        rtpCapabilities: this.device.rtpCapabilities,
        remoteProducerId,
        serverConsumerTransportId,
      },
      async ({ params }) => {
        if (params.error) {
          console.log('Cannot Consume')
          return
        }

        console.log(`Consumer Params ${params}`)

        // then consume with the local consumer transport
        // which creates a consumer
        this.consumer = await consumerTransport.consume({
          id: params.id,
          producerId: params.producerId,
          kind: params.kind,
          rtpParameters: params.rtpParameters,
        })
        console.log('Create consumer finally')
        this.consumerTransports.push({
          consumerTransport,
          serverConsumerTransportId: params.id,
          producerId: remoteProducerId,
          consumer: this.consumer,
        })
        // destructure and retrieve the video track from the producer
        const { track } = this.consumer
        this.producers.set(remoteProducerId, new MediaStream([track]))
        console.log('------------------- lets dispatch', this.newConsumerEventCallback)
        if (this.newConsumerEventCallback)
          this.newConsumerEventCallback({
            kind: params.kind,
            producerId: remoteProducerId,
            stream: new MediaStream([track]),
          })

        // remoteVideoRef.current.srcObject = new MediaStream([track])

        // the server consumer started with media paused
        // so we need to inform the server to resume
        this.socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId })
      }
    )
  }
}
