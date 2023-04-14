const config = require('../../src/config')
const FFmpeg = require('../codecs/ffmpeg')
const GStreamer = require('../codecs/gstreamer')
const { releasePort, getPort } = require('./port')

const handleStopRecordRequest = async (room, peer) => {
  console.log('handleStopRecordRequest() [data:%o]', peer.id)

  peer.process.kill()
  peer.process = undefined

  // Release ports from port set
  for (const remotePort of peer.remotePorts) {
    releasePort(remotePort)
  }
}

const publishProducerRtpStream = async (peer, producer, router) => {
  console.log('publishProducerRtpStream()')

  // Create the mediasoup RTP Transport used to send media to the GStreamer process
  const rtpTransportConfig = config.mediasoup.plainRtpTransport

  // If the process is set to GStreamer set rtcpMux to false
  if (process.env.PROCESS_NAME === 'GStreamer') {
    rtpTransportConfig.rtcpMux = false
  }

  const rtpTransport = await router.createPlainTransport(rtpTransportConfig)

  // Set the receiver RTP ports
  const remoteRtpPort = await getPort()
  peer.remotePorts.push(remoteRtpPort)

  let remoteRtcpPort
  // If rtpTransport rtcpMux is false also set the receiver RTCP ports
  if (!rtpTransportConfig.rtcpMux) {
    remoteRtcpPort = await getPort()
    peer.remotePorts.push(remoteRtcpPort)
  }

  // Connect the mediasoup RTP transport to the ports used by GStreamer
  await rtpTransport.connect({
    ip: '127.0.0.1',
    port: remoteRtpPort,
    rtcpPort: remoteRtcpPort,
  })

  peer.addTransport(rtpTransport)

  const codecs = []
  // Codec passed to the RTP Consumer must match the codec in the Mediasoup router rtpCapabilities
  console.log('🚀 ~ file: index.js:55 ~ routerCodec ~ producer:', producer)
  const routerCodec = router.rtpCapabilities.codecs.find(codec => {
    return codec.kind === producer.kind
  })
  console.log(
    '🚀 ~ file: index.js:54 ~ publishProducerRtpStream ~ router.rtpCapabilities:',
    router.rtpCapabilities,
    producer
  )
  codecs.push(routerCodec)

  const rtpCapabilities = {
    codecs,
    rtcpFeedback: [],
  }

  console.log('🚀 ~ file: index.js:57 ~ publishProducerRtpStream ~ rtpCapabilities:', rtpCapabilities)
  // Start the consumer paused
  // Once the gstreamer process is ready to consume resume and send a keyframe
  const rtpConsumer = await rtpTransport.consume({
    producerId: producer.producer_id,
    rtpCapabilities,
    paused: true,
  })

  peer.consumers.set(rtpConsumer.id, rtpConsumer)

  return {
    remoteRtpPort,
    remoteRtcpPort,
    localRtcpPort: rtpTransport.rtcpTuple ? rtpTransport.rtcpTuple.localPort : undefined,
    rtpCapabilities,
    rtpParameters: rtpConsumer.rtpParameters,
  }
}

const startRecord = async (room, peer) => {
  let recordInfo = {}

  for (const producer of room.getProducerListForPeer()) {
    recordInfo[producer.kind] = await publishProducerRtpStream(peer, producer, room.router)
  }

  recordInfo.fileName = Date.now().toString()

  peer.process = getProcess(recordInfo)

  setTimeout(async () => {
    for (const consumer of peer.consumers.values()) {
      // Sometimes the consumer gets resumed before the GStreamer process has fully started
      // so wait a couple of seconds
      await consumer.resume()
      await consumer.requestKeyFrame()
    }
  }, 1000)
}

// Returns process command to use (GStreamer/FFmpeg) default is FFmpeg
const getProcess = recordInfo => {
  switch (process.env.PROCESS_NAME) {
    case 'GStreamer':
      return new GStreamer(recordInfo)
    case 'FFmpeg':
    default:
      return new FFmpeg(recordInfo)
  }
}
module.exports = {
  startRecord,
  handleStopRecordRequest,
}
