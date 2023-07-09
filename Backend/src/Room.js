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


  async StartRecording(){
    // Create a mediasoup WebRTC transport
const transport = await router.createWebRtcTransport({
  listenIps: [{ ip: '0.0.0.0', announcedIp: null }],
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
});

// Set up event handlers for the transport
transport.on('dtlsstatechange', (dtlsState) => {
  if (dtlsState === 'closed') {
    console.log('WebRTC transport closed');
  }
});
transport.on('close', () => {
  console.log('WebRTC transport closed');
});

// Connect the transport to a remote client
const { params } = await transport.connect({ dtlsParameters });

// Create a mediasoup producer for each incoming audio track
for (const audioTrack of incomingAudioTracks) {
  const producer = await transport.produce({
    kind: 'audio',
    rtpParameters,
    appData: { source: audioTrack },
  });
}

// Create a mediasoup producer for each incoming video track
for (const videoTrack of incomingVideoTracks) {
  const producer = await transport.produce({
    kind: 'video',
    rtpParameters,
    appData: { source: videoTrack },
  });
}

// Create a mediasoup consumer for each outgoing audio track
for (const audioTrack of outgoingAudioTracks) {
  const consumer = await transport.consume({
    producerId,
    rtpCapabilities,
    paused,
    appData: { sink: audioTrack },
  });
}

// Create a mediasoup consumer for each outgoing video track
for (const videoTrack of outgoingVideoTracks) {
  const consumer = await transport.consume({
    producerId,
    rtpCapabilities,
    paused,
    appData: { sink: videoTrack },
  });
}

// Start recording the room
router.createPlainRtpTransport().then((rtpTransport) => {
  const rtpStream = fs.createWriteStream('/path/to/recording.pcm');
  
  // Set up event handlers for the RTP transport
  rtpTransport.on('rtp', ({ payload }) => {
    rtpStream.write(payload);
  });
  
  // Connect the RTP transport to the WebRTC transport
  rtpTransport.connect({ ip, port, rtcpPort }).then(() => {
    console.log('Recording started');
    
    // Stop recording after some time has passed
    setTimeout(() => {
      rtpStream.end();
      console.log('Recording stopped');
      
      // Close all transports and exit the process
      Promise.all([
        transport.close(),
        rtpTransport.close(),
        worker.close(),
      ]).then(() => process.exit());
      
    }, 5000);
    
  });
});

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
      const individualPeer = this.peers.get(socket_id)

      individualPeer.createProducer(producerTransportId, rtpParameters, kind).then(producer => {
        resolve(producer.id)
        this.broadCast(socket_id, 'newProducers', [
          {
            producer_id: producer.id,
            producer_socket_id: socket_id,
            participantName: individualPeer.name,
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
