const config = require('./config')
const { forEach } = require('lodash')
const fs = require('fs')
const { spawn } = require('child_process')
const Promise = require('bluebird')
module.exports = class Room {
  constructor(room_id, worker, io) {
    this.id = room_id
    this.recordingConsumers = []
    this.recordingTransport = null
    this.ffmpeg = null
    const mediaCodecs = config.mediasoup.router.mediaCodecs
    worker
      .createRouter({
        mediaCodecs,
      })
      .then(router => {
        this.router = router
      })

    this.peers = new Map()
    this.io = io
  }

  addPeer(peer) {
    this.peers.set(peer.id, peer)
  }

  getProducerListForPeer() {
    let producerList = []
    this.peers.forEach(peer => {
      peer.producers.forEach(producer => {
        producerList.push({
          producer_id: producer.id,
          kind: producer.kind,
        })
      })
    })
    return producerList
  }

  getRtpCapabilities() {
    return this.router.rtpCapabilities
  }

  async startRecording() {
    await this.createRecordingTransport()
    // create mediasoup consumer

    const producers = this.getProducerListForPeer()

    // combine SDP offers from all producers into a single offer
    await Promise.all(
      producers.map(async ({ producer_id }) => {
        const consumer = this.recordingTransport.consume({
          producerId: producer_id, // consume all producers
          rtpCapabilities: this.getRtpCapabilities(),
        })
        this.recordingConsumers.push(consumer)
        // setTimeout(() => {
        //   consumer.resume()
        //   console.log(
        //     '🚀 ~ file: Room.js:52 ~ Room ~ forEach ~ consumer:',
        //     consumer.track,
        //     consumer.kind,
        //     consumer.appData
        //   )
        // }, 1000)
      })
    )
    const fileStream = fs.createWriteStream('media.webm')
    this.ffmpeg = spawn('ffmpeg', [
      '-y',
      '-f',
      'sdp',
      '-i',
      'v=0',
      'o=- 0 0 IN IP4 127.0.0.1',
      's=-',
      'c=IN IP4 127.0.0.1',
      't=0 0',
      'm=audio 5004 RTP/AVPF 111',
      'a=rtcp:5005',
      'a=rtpmap:111 opus/48000/2',
      'a=fmtp:111 minptime=10;useinbandfec=1',
      'm=video 5006 RTP/AVPF 125',
      'a=rtcp:5007',
      'a=rtpmap:125 H264/90000',
      'a=fmtp:125 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f',
      '-c:v',
      'libvpx-vp9',
      '-deadline',
      'realtime',
      '-crf',
      '40',
      '-b:v',
      '0',
      '-pix_fmt',
      'yuv420p',
      '-c:a',
      'opus',
      '-strict',
      '-2',
      '-f',
      'webm',
      '-movflags',
      '+faststart',
      'pipe:1',
    ])

    // pipe ffmpeg output to file stream
    this.ffmpeg.stdout.pipe(fileStream)
  }
  async createRecordingTransport() {
    if (!this.recordingTransport)
      this.recordingTransport = await this.router.createPlainTransport(config.mediasoup.plainRtpTransport)
  }
  async stopRecording() {
    this.ffmpeg.kill('SIGINT')

    this.recordingConsumers = []
    await this.recordingTransport.close()
    this.recordingTransport = null
    await Promise.each(this.recordingConsumers, async consumer => consumer.close())
  }
  async createWebRtcTransport(socket_id) {
    const { maxIncomingBitrate, initialAvailableOutgoingBitrate } = config.mediasoup.webRtcTransport

    const transport = await this.router.createWebRtcTransport({
      listenIps: config.mediasoup.webRtcTransport.listenIps,
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      initialAvailableOutgoingBitrate,
    })
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate)
      } catch (error) {}
    }

    transport.on('dtlsstatechange', dtlsState => {
      if (dtlsState === 'closed') {
        console.log('Transport close', { name: this.peers.get(socket_id).name })
        transport.close()
      }
    })

    transport.on('close', () => {
      console.log('Transport close', { name: this.peers.get(socket_id).name })
    })

    console.log('Adding transport', { transportId: transport.id })
    this.peers.get(socket_id).addTransport(transport)
    return {
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    }
  }

  async connectPeerTransport(socket_id, transport_id, dtlsParameters) {
    if (!this.peers.has(socket_id)) return

    await this.peers.get(socket_id).connectTransport(transport_id, dtlsParameters)
  }

  async produce(socket_id, producerTransportId, rtpParameters, kind) {
    // handle undefined errors
    return new Promise((resolve, reject) => {
      this.peers
        .get(socket_id)
        .createProducer(producerTransportId, rtpParameters, kind)
        .then(producer => {
          resolve(producer.id)
          this.broadCast(socket_id, 'newProducers', [
            {
              producer_id: producer.id,
              producer_socket_id: socket_id,
            },
          ])
        })
    })
  }

  async consume(socket_id, consumer_transport_id, producer_id, rtpCapabilities) {
    // handle nulls
    if (
      !this.router.canConsume({
        producerId: producer_id,
        rtpCapabilities,
      })
    ) {
      console.error('can not consume')
      return
    }

    let { consumer, params } = await this.peers
      .get(socket_id)
      .createConsumer(consumer_transport_id, producer_id, rtpCapabilities)

    consumer.on(
      'producerclose',
      function () {
        console.log('Consumer closed due to producerclose event', {
          name: `${this.peers.get(socket_id).name}`,
          consumer_id: `${consumer.id}`,
        })
        this.peers.get(socket_id).removeConsumer(consumer.id)
        // tell client consumer is dead
        this.io.to(socket_id).emit('consumerClosed', {
          consumer_id: consumer.id,
        })
      }.bind(this)
    )

    return params
  }

  async removePeer(socket_id) {
    this.peers.get(socket_id).close()
    this.peers.delete(socket_id)
  }

  closeProducer(socket_id, producer_id) {
    this.peers.get(socket_id).closeProducer(producer_id)
  }

  broadCast(socket_id, name, data) {
    for (let otherID of Array.from(this.peers.keys()).filter(id => id !== socket_id)) {
      this.send(otherID, name, data)
    }
  }

  send(socket_id, name, data) {
    this.io.to(socket_id).emit(name, data)
  }

  getPeers() {
    return this.peers
  }

  toJson() {
    return {
      id: this.id,
      peers: JSON.stringify([...this.peers]),
    }
  }
}
