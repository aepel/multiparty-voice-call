// const mediasoupClient = require('mediasoup-client')
// const config = require('../config')
// let device
// let rtpCapabilities
// let producerTransport
// let consumerTransport
// let producer
// let consumer

// const createDevice = async () => {
//   try {
//     device = new mediasoupClient.Device()

//     // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-load
//     // Loads the device with RTP capabilities of the Router (server side)
//     await device.load({
//       // see getRtpCapabilities() below
//       routerRtpCapabilities: rtpCapabilities,
//     })

//     console.log('RTP Capabilities', device.rtpCapabilities)
//   } catch (error) {
//     console.log(error)
//     if (error.name === 'UnsupportedError') console.warn('browser not supported')
//   }
// }

// const getRtpCapabilities = socket => {
//   // make a request to the server for Router RTP Capabilities
//   // see server's socket.on('getRtpCapabilities', ...)
//   // the server sends back data object which contains rtpCapabilities
//   socket.emit('getRtpCapabilities', data => {
//     console.log(`Router RTP Capabilities... ${data.rtpCapabilities}`)

//     // we assign to local variable and will be used when
//     // loading the client Device (see createDevice above)
//     rtpCapabilities = data.rtpCapabilities
//   })
// }

// const createSendTransport = socket => {
//   // see server's socket.on('createWebRtcTransport', sender?, ...)
//   // this is a call from Producer, so sender = true
//   socket.emit('createWebRtcTransport', { sender: true }, ({ params }) => {
//     // The server sends back params needed
//     // to create Send Transport on the client side
//     if (params.error) {
//       console.log(params.error)
//       return
//     }

//     console.log(params)

//     // creates a new WebRTC Transport to send media
//     // based on the server's producer transport params
//     // https://mediasoup.org/documentation/v3/mediasoup-client/api/#TransportOptions
//     producerTransport = device.createSendTransport(params)

//     // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
//     // this event is raised when a first call to transport.produce() is made
//     // see connectSendTransport() below
//     producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
//       try {
//         // Signal local DTLS parameters to the server side transport
//         // see server's socket.on('transport-connect', ...)
//         await socket.emit('transport-connect', {
//           dtlsParameters,
//         })

//         // Tell the transport that parameters were transmitted.
//         callback()
//       } catch (error) {
//         errback(error)
//       }
//     })

//     producerTransport.on('produce', async (parameters, callback, errback) => {
//       console.log(parameters)

//       try {
//         // tell the server to create a Producer
//         // with the following parameters and produce
//         // and expect back a server side producer id
//         // see server's socket.on('transport-produce', ...)
//         await socket.emit(
//           'transport-produce',
//           {
//             kind: parameters.kind,
//             rtpParameters: parameters.rtpParameters,
//             appData: parameters.appData,
//           },
//           ({ id }) => {
//             // Tell the transport that parameters were transmitted and provide it with the
//             // server side producer's id.
//             callback({ id })
//           }
//         )
//       } catch (error) {
//         errback(error)
//       }
//     })
//   })
// }

// const connectSendTransport = async () => {
//   // we now call produce() to instruct the producer transport
//   // to send media to the Router
//   // https://mediasoup.org/documentation/v3/mediasoup-client/api/#transport-produce
//   // this action will trigger the 'connect' and 'produce' events above
//   producer = await producerTransport.produce(config.mediasoupParams)

//   producer.on('trackended', () => {
//     console.log('track ended')

//     // close video track
//   })

//   producer.on('transportclose', () => {
//     console.log('transport ended')

//     // close video track
//   })
// }

// const createRecvTransport = async socket => {
//   // see server's socket.on('consume', sender?, ...)
//   // this is a call from Consumer, so sender = false
//   await socket.emit('createWebRtcTransport', { sender: false }, ({ params }) => {
//     // The server sends back params needed
//     // to create Send Transport on the client side
//     if (params.error) {
//       console.log(params.error)
//       return
//     }

//     console.log(params)

//     // creates a new WebRTC Transport to receive media
//     // based on server's consumer transport params
//     // https://mediasoup.org/documentation/v3/mediasoup-client/api/#device-createRecvTransport
//     consumerTransport = device.createRecvTransport(params)

//     // https://mediasoup.org/documentation/v3/communication-between-client-and-server/#producing-media
//     // this event is raised when a first call to transport.produce() is made
//     // see connectRecvTransport() below
//     consumerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
//       try {
//         // Signal local DTLS parameters to the server side transport
//         // see server's socket.on('transport-recv-connect', ...)
//         await socket.emit('transport-recv-connect', {
//           dtlsParameters,
//         })

//         // Tell the transport that parameters were transmitted.
//         callback()
//       } catch (error) {
//         // Tell the transport that something was wrong
//         errback(error)
//       }
//     })
//   })
// }

// const connectRecvTransport = async (remoteVideoRef, socket) => {
//   // for consumer, we need to tell the server first
//   // to create a consumer based on the rtpCapabilities and consume
//   // if the router can consume, it will send back a set of params as below
//   await socket.emit(
//     'consume',
//     {
//       rtpCapabilities: device.rtpCapabilities,
//     },
//     async ({ params }) => {
//       if (params.error) {
//         console.log('Cannot Consume')
//         return
//       }

//       console.log(params)
//       // then consume with the local consumer transport
//       // which creates a consumer
//       consumer = await consumerTransport.consume({
//         id: params.id,
//         producerId: params.producerId,
//         kind: params.kind,
//         rtpParameters: params.rtpParameters,
//       })

//       // destructure and retrieve the video track from the producer
//       const { track } = consumer

//       remoteVideoRef.srcObject = new MediaStream([track])

//       // the server consumer started with media paused
//       // so we need to inform the server to resume
//       socket.emit('consumer-resume')
//     }
//   )
// }
