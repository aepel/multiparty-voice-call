import { Device } from 'mediasoup-client'

//const config = require('../config')

class Mediasoup {
  constructor(socket, localMediaRef) {
    this.localMediaRef = localMediaRef

    this.socket = socket
    this.producerTransport = null
    this.consumerTransport = null
    this.device = null

    this.consumers = new Map()
    this.producers = new Map()

    /**
     * map that contains a mediatype as key and producer_id as value
     */
    this.producerLabel = new Map()
    this.mediaType = {
      audio: 'audioType',
      video: 'videoType',
      screen: 'screenType',
    }
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
  async connect() {
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

  async produce(type, deviceId = null) {
    let mediaConstraints = {}
    let audio = false
    let screen = false
    switch (type) {
      case this.mediaType.audio:
        mediaConstraints = {
          audio: {
            deviceId: deviceId,
          },
          video: false,
        }
        audio = true
        break
      case this.mediaType.video:
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
      case this.mediaType.screen:
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
    let producerId
    try {
      stream = screen
        ? await navigator.mediaDevices.getUserMedia({
            video: {
              mediaSource: 'tab',
              mimeType: 'video/webm;codecs=vp9',
            },
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100,
            },
          })
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
      // this.mixingStream.addTrack(producer.track)

      this.producers.set(producer.id, producer)
      producerId = producer.id

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
    } catch (err) {
      console.log('Produce error:', err)
    }
    return { screen, audio, stream, producerId }
  }

  async consume(producer_id, participantName, newConsumerEventCallback) {
    //let info = await this.roomInfo()
    if (!this.consumerTransport) await this.initConsumerTransport()

    this.getConsumeStream(producer_id).then(({ producerId: producer_id, consumer, stream, kind }) => {
      this.consumers.set(consumer.id, consumer)

      if (newConsumerEventCallback)
        newConsumerEventCallback({
          kind: kind,
          consumerId: consumer.id,
          stream,
          participantName,
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
    this.consumers.delete(consumer_id)
    console.log('Removing Consumer' + consumer_id)
  }
  exit(offline = false) {
    this._isOpen = false
    this.consumerTransport.close()
    this.producerTransport.close()
  }
}

export default Mediasoup
