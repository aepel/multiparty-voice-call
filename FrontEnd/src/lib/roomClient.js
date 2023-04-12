import { Device } from 'mediasoup-client'
const mediaType = {
  audio: 'audioType',
  video: 'videoType',
  screen: 'screenType',
}
const _EVENTS = {
  exitRoom: 'exitRoom',
  openRoom: 'openRoom',
  startVideo: 'startVideo',
  stopVideo: 'stopVideo',
  startAudio: 'startAudio',
  stopAudio: 'stopAudio',
  startScreen: 'startScreen',
  stopScreen: 'stopScreen',
}

class RoomClient {
  constructor(localMediaRef, socket, room_id, name, newConsumerEventCallback, removeConsumerCallback, successCallback) {
    this.name = name
    this.localMediaRef = localMediaRef

    this.removeConsumerCallback = removeConsumerCallback
    this.newConsumerEventCallback = newConsumerEventCallback

    this.socket = socket
    this.producerTransport = null
    this.consumerTransport = null
    this.device = null
    this.room_id = room_id

    this.consumers = new Map()
    this.producers = new Map()

    /**
     * map that contains a mediatype as key and producer_id as value
     */
    this.producerLabel = new Map()

    this._isOpen = false
    this.eventListeners = new Map()

    Object.keys(_EVENTS).forEach(evt => {
      this.eventListeners.set(evt, [])
    })

    this.mixingStream = new MediaStream()
    this.createRoom(room_id).then(async () => {
      await this.join(name, room_id)
      this.initSockets()
      this._isOpen = true
      if (successCallback) successCallback()
    })
  }

  async request(type, data = {}) {
    return new Promise((resolve, reject) => {
      this.socket.emit(type, data, data => {
        if (data.error) {
          reject(data.error)
        } else {
          resolve(data)
        }
      })
    })
  }
  ////////// INIT /////////

  async createRoom(room_id) {
    console.log('Create room:' + room_id)
    await this.request('createRoom', {
      room_id,
    }).catch(err => {
      console.log('Create room error:', err)
    })
    console.log('Create room:' + room_id + 'Created')
  }

  async join(name, room_id) {
    let roomName = await this.request('join', {
      name,
      room_id,
    }).catch(err => {
      console.log('Join error:', err)
    })

    console.log('Joined to room', roomName)
    const rtpCapabilities = await this.request('getRouterRtpCapabilities')
    this.device = await this.loadDevice(rtpCapabilities)
    await this.initTransports()
    this.socket.emit('getProducers')
  }

  async loadDevice(routerRtpCapabilities) {
    let device
    try {
      device = new Device()
    } catch (error) {
      if (error.name === 'UnsupportedError') {
        console.error('Browser not supported')
        alert('Browser not supported')
      }
      console.error(error)
    }
    await device.load({
      routerRtpCapabilities,
    })
    return device
  }
  async initProducerTransport() {
    const rtcTransport = await this.request('createWebRtcTransport', {
      forceTcp: false,
      rtpCapabilities: this.device.rtpCapabilities,
    })

    if (rtcTransport.error) {
      console.error(rtcTransport.error)
      return
    }

    this.producerTransport = this.device.createSendTransport(rtcTransport)

    this.producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
      this.request('connectTransport', {
        dtlsParameters,
        transport_id: rtcTransport.id,
      })
        .then(callback)
        .catch(errback)
    })

    this.producerTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const { producer_id } = await this.request('produce', {
          producerTransportId: this.producerTransport.id,
          kind,
          rtpParameters,
        })
        callback({
          id: producer_id,
        })
      } catch (err) {
        errback(err)
      }
    })

    this.producerTransport.on('connectionstatechange', state => {
      switch (state) {
        case 'connecting':
          break

        case 'connected':
          //localVideo.srcObject = stream
          break

        case 'failed':
          this.producerTransport.close()
          break

        default:
          break
      }
    })
  }
  async initConsumerTransport() {
    const data = await this.request('createWebRtcTransport', {
      forceTcp: false,
    })

    if (data.error) {
      console.error(data.error)
      return
    }

    // only one needed
    this.consumerTransport = this.device.createRecvTransport(data)
    console.log(
      '🚀 ~ file: roomClient.js:191 ~ RoomClient ~ initConsumerTransport ~ this.consumerTransport:',
      this.consumerTransport
    )
    this.consumerTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
      this.request('connectTransport', {
        transport_id: this.consumerTransport.id,
        dtlsParameters,
      })
        .then(callback)
        .catch(errback)
    })

    this.consumerTransport.on('connectionstatechange', async state => {
      switch (state) {
        case 'connecting':
          break

        case 'connected':
          //remoteVideo.srcObject = await stream;
          //await socket.request('resume');
          break

        case 'failed':
          this.consumerTransport.close()
          break

        default:
          break
      }
    })
  }
  async initTransports() {
    // init producerTransport
    this.initProducerTransport()
  }

  initSockets() {
    this.socket.on('consumerClosed', ({ consumer_id }) => {
      console.log('Closing consumer:', consumer_id)
      this.removeConsumer(consumer_id)
    })

    /**
     * data: [ {
     *  producer_id:
     *  producer_socket_id:
     * }]
     */
    this.socket.on('newProducers', async data => {
      console.log('New producers', data)
      for (let { producer_id } of data) {
        await this.consume(producer_id)
      }
    })

    this.socket.on('disconnect', () => {
      this.exit(true)
    })
  }

  //////// MAIN FUNCTIONS /////////////

  async produce(type, deviceId = null) {
    let mediaConstraints = {}
    let audio = false
    let screen = false
    switch (type) {
      case mediaType.audio:
        mediaConstraints = {
          audio: {
            deviceId: deviceId,
          },
          video: false,
        }
        audio = true
        break
      case mediaType.video:
        mediaConstraints = {
          audio: false,
          video: {
            width: {
              min: 640,
              ideal: 1920,
            },
            height: {
              min: 400,
              ideal: 1080,
            },
            deviceId: deviceId,
            /*aspectRatio: {
                            ideal: 1.7777777778
                        }*/
          },
        }
        break
      case mediaType.screen:
        mediaConstraints = false
        screen = true
        break
      default:
        return
    }
    if (!this.device.canProduce('video') && !audio) {
      console.error('Cannot produce video')
      return
    }
    if (this.producerLabel.has(type)) {
      console.log('Producer already exists for this type ' + type)
      return
    }
    console.log('Mediacontraints:', mediaConstraints)
    let stream
    try {
      stream = screen
        ? await navigator.mediaDevices.getDisplayMedia()
        : await navigator.mediaDevices.getUserMedia(mediaConstraints)
      console.log(navigator.mediaDevices.getSupportedConstraints())

      const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]
      const params = {
        track,
      }
      if (!audio && !screen) {
        params.encodings = [
          {
            rid: 'r0',
            maxBitrate: 100000,
            //scaleResolutionDownBy: 10.0,
            // scalabilityMode: 'S1T3'
          },
          {
            rid: 'r1',
            maxBitrate: 300000,
            // scalabilityMode: 'S1T3'
          },
          {
            rid: 'r2',
            maxBitrate: 900000,
            // scalabilityMode: 'S1T3'
          },
        ]
        params.codecOptions = {
          videoGoogleStartBitrate: 1000,
        }
      }
      const producer = await this.producerTransport.produce(params)
      this.mixingStream.addTrack(producer.track)
      console.log('Producer', producer)

      this.producers.set(producer.id, producer)

      if (!audio) {
        this.localMediaRef.current.srcObject = stream
        this.localMediaRef.current.id = producer.id
        this.localMediaRef.current.id = producer.id
        this.localMediaRef.current.id = producer.id

        // this.handleFS(elem.id)
      }

      producer.on('trackended', () => {
        this.closeProducer(type)
      })

      producer.on('transportclose', () => {
        console.log('Producer transport close')
        if (!audio) {
          this.localMediaRef.current.srcObject.getTracks().forEach(track => {
            track.stop()
          })
          // elem.parentNode.removeChild(elem)
        }
        this.producers.delete(producer.id)
      })

      producer.on('close', () => {
        console.log('Closing producer')
        if (!audio) {
          this.localMediaRef.current.srcObject.getTracks().forEach(track => {
            track.stop()
          })
        }
        this.producers.delete(producer.id)
      })

      this.producerLabel.set(type, producer.id)

      switch (type) {
        case mediaType.audio:
          this.event(_EVENTS.startAudio)
          break
        case mediaType.video:
          this.event(_EVENTS.startVideo)
          break
        case mediaType.screen:
          this.event(_EVENTS.startScreen)
          break
        default:
          return
      }
    } catch (err) {
      console.log('Produce error:', err)
    }
  }

  async consume(producer_id) {
    //let info = await this.roomInfo()
    if (!this.consumerTransport) await this.initConsumerTransport()

    this.getConsumeStream(producer_id).then(({ producerId: producer_id, consumer, stream, kind }) => {
      this.consumers.set(consumer.id, consumer)

      if (this.newConsumerEventCallback)
        this.newConsumerEventCallback({
          kind: kind,
          consumerId: consumer.id,
          stream,
        })

      consumer.on('trackended', () => {
        this.removeConsumer(consumer.id)
      })

      consumer.on('transportclose', () => {
        this.removeConsumer(consumer.id)
      })
    })
  }

  async getConsumeStream(producerId) {
    const { rtpCapabilities } = this.device

    const data = await this.request('consume', {
      rtpCapabilities,
      consumerTransportId: this.consumerTransport.id, // might be
      producerId,
    })
    const { id, kind, rtpParameters } = data

    let codecOptions = {}
    const consumer = await this.consumerTransport.consume({
      id,
      producerId,
      kind,
      rtpParameters,
      codecOptions,
    })

    const stream = new MediaStream()
    stream.addTrack(consumer.track)
    this.mixingStream.addTrack(consumer.track)
    return {
      consumer,
      stream,
      kind,
    }
  }

  closeProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log('There is no producer for this type ' + type)
      return
    }

    let producer_id = this.producerLabel.get(type)
    console.log('Close producer', producer_id)

    this.socket.emit('producerClosed', {
      producer_id,
    })

    this.producers.get(producer_id).close()
    this.producers.delete(producer_id)
    this.producerLabel.delete(type)

    // if (type !== mediaType.audio) {
    //   let elem = document.getElementById(producer_id)
    //   elem.srcObject.getTracks().forEach(function (track) {
    //     track.stop()
    //   })
    //   elem.parentNode.removeChild(elem)
    // }

    switch (type) {
      case mediaType.audio:
        this.event(_EVENTS.stopAudio)
        break
      case mediaType.video:
        this.event(_EVENTS.stopVideo)
        break
      case mediaType.screen:
        this.event(_EVENTS.stopScreen)
        break
      default:
        return
    }
  }

  pauseProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log('There is no producer for this type ' + type)
      return
    }

    let producer_id = this.producerLabel.get(type)
    this.producers.get(producer_id).pause()
  }

  resumeProducer(type) {
    if (!this.producerLabel.has(type)) {
      console.log('There is no producer for this type ' + type)
      return
    }

    let producer_id = this.producerLabel.get(type)
    this.producers.get(producer_id).resume()
  }

  removeConsumer(consumer_id) {
    // let elem = document.getElementById(consumer_id)
    // elem.srcObject.getTracks().forEach(function (track) {
    //   track.stop()
    // })
    // elem.parentNode.removeChild(elem)
    this.consumers.delete(consumer_id)
    console.log('Removing Consumer' + consumer_id)
    this.removeConsumerCallback({ consumerId: consumer_id })
  }

  exit(offline = false) {
    let clean = () => {
      this._isOpen = false
      this.consumerTransport.close()
      this.producerTransport.close()
      this.socket.off('disconnect')
      this.socket.off('newProducers')
      this.socket.off('consumerClosed')
    }

    if (!offline) {
      this.request('exitRoom')
        .then(e => console.log(e))
        .catch(e => console.warn(e))
        .finally(() => clean())
    } else {
      clean()
    }

    this.event(_EVENTS.exitRoom)
  }

  ///////  HELPERS //////////

  async roomInfo() {
    let info = await this.request('getMyRoomInfo')
    return info
  }

  static get mediaType() {
    return mediaType
  }

  event(evt) {
    if (this.eventListeners.has(evt)) {
      this.eventListeners.get(evt).forEach(callback => callback())
    }
  }

  on(evt, callback) {
    this.eventListeners.get(evt).push(callback)
  }

  //////// GETTERS ////////

  isOpen() {
    return this._isOpen
  }

  static get EVENTS() {
    return _EVENTS
  }
  isRecording() {
    return this._isRecording
  }
  async startRecordingCall() {
    this.socket.emit("startRecording")
  }
  async stopRecordingCall() {
    this.socket.emit("stopRecording")
  }
}

export default RoomClient
