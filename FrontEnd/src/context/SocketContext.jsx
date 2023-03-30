import React, { createContext, useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'

export const SocketContext = createContext({})

const SocketProvider = ({ children }) => {
  const videoRef = useRef(null)
  // const [transport, setTransport] = useState(null)
  // const [producer, setProducer] = useState(null)
  // const [consumer, setConsumer] = useState(null)
  const [error] = useState(null)

  // Replace with your server URL
  const socket = io('https://localhost:3003')
  let producer, consumer, transport
  useEffect(() => {
    socket.on('connection-success', ({ socketId }) => {
      console.log('SocketId', socketId)
    })
    return () => {
      if (producer) {
        producer.close()
      }
      if (consumer) {
        consumer.close()
      }
      if (transport) {
        transport.close()
      }
      socket.disconnect()
    }
  }, [socket, consumer, producer, transport])

  // // Clean up on unmount

  // // useEffect(() => {
  // //   return () => {
  // //     if (producer) {
  // //       producer.close()
  // //     }
  // //     if (consumer) {
  // //       consumer.close()
  // //     }
  // //     if (transport) {
  // //       transport.close()
  // //     }
  // //     socket.disconnect()
  // //   }
  // // }, [transport, producer, consumer, createProducer, createConsumer, device])
  // // Connect to the server and create a transport
  // socket.on('connect', async () => {
  //   try {
  //     let mediaSoupDevice = new mediasoup.Device()
  //     const routerRtpCapabilities = await new Promise((resolve, reject) => {
  //       socket.emit('getRouterRtpCapabilities', null, null, response => resolve(response))
  //     })
  //     console.log('🚀 ~ file: SocketContext.jsx:29 ~ socket.on ~ rtpCapabilities:', routerRtpCapabilities)
  //     await mediaSoupDevice.load({ routerRtpCapabilities })

  //     const data = await new Promise((resolve, reject) => {
  //       socket.emit('createTransport', { ip: window.location.hostname }, null, response => resolve(response))
  //     })

  //     const newTransport = await createTransport(data, 'send', mediaSoupDevice)
  //     setTransport(newTransport)
  //     await createProducer(newTransport, routerRtpCapabilities)
  //   } catch (err) {
  //     console.error(err)
  //     setError(err)
  //   }

  //   // Create a producer when the transport is connected
  //   if (transport) {
  //     transport.on('connect', async ({ dtlsParameters }, callback) => {
  //       console.log('connecting')
  //       try {
  //       } catch (err) {
  //         setError(err)
  //       }
  //     })
  //     transport.on('produce', async ({ dtlsParameters }, callback) => {
  //       console.log('produce')
  //       try {
  //       } catch (err) {
  //         setError(err)
  //       }
  //     })
  //   }
  // })

  // // Create a consumer when a new one is added
  // socket.on('newConsumer', async ({ consumerId }) => {
  //   const newConsumer = await createConsumer(consumerId, transport)
  //   setConsumer(newConsumer)
  // })
  // // async function createTransport(data) {
  // //   const { transportId, iceParameters, iceCandidates, dtlsParameters, sessionId } = data
  // //   const newTransport = await window.mediasoupClient.createWebRtcTransport({
  // //     listenIps: [{ ip: '0.0.0.0', announcedIp: window.location.hostname }],
  // //     iceParameters,
  // //     iceCandidates,
  // //     dtlsParameters,
  // //   })
  // //   setTransport(newTransport)
  // // }
  // async function createTransport(data, type = 'send', mediaSoupDevice) {
  //   const { transportId, iceParameters, iceCandidates, dtlsParameters, sessionId } = data
  //   console.log(
  //     '🚀 ~ file: SocketContext.jsx:92 ~ createTransport ~ { transportId, iceParameters, iceCandidates, dtlsParameters, sessionId }:',
  //     {
  //       listenIps: [{ ip: '0.0.0.0', announcedIp: window.location.hostname }],
  //       id: transportId,
  //       iceParameters,
  //       iceCandidates,
  //       dtlsParameters,
  //     }
  //   )

  //   const mediasoupTransport = mediaSoupDevice.createSendTransport({
  //     listenIps: [{ ip: '0.0.0.0', announcedIp: window.location.hostname }],
  //     id: transportId,
  //     iceParameters,
  //     iceCandidates,
  //     dtlsParameters,
  //   })
  //   mediasoupTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
  //     await socket.emit(`connect${type}Transport`, {
  //       transportId: transportId,
  //       dtlsParameters,
  //     })
  //     callback()
  //   })
  //   mediasoupTransport.on('produce', async ({ dtlsParameters }, callback, errback) => {
  //     console.log('produce transport')
  //     callback()
  //   })
  //   return mediasoupTransport
  // }

  // async function createProducer(clientTransport, routerRtpCapabilities) {
  //   try {
  //     console.log('navigator......', clientTransport)
  //     const audioVideoStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  //     // const videoStream = await navigator.mediaDevices.getUserMedia()
  //     const audioVideoTrack = audioVideoStream.getAudioTracks()[0]

  //     const params = { track: audioVideoTrack, stream: audioVideoStream }
  //     videoRef.srcObject = audioVideoStream
  //     const { id } = await socket.emit('produce', params)
  //     // const videoTrack = videoStream.getVideoTracks()[0]
  //     // const newProducer = await clientTransport.produce({
  //     //   id: clientTransport.id,
  //     //   kind: 'video',
  //     //   rtpParameters: routerRtpCapabilities,
  //     //   track: [audioTrack, videoTrack],
  //     //   codecOptions: {
  //     //     videoGoogleStartBitrate: 1000,
  //     //   },
  //     // })
  //     // if (audioVideoTrack) {
  //     //   setProducer(await clientTransport.produce({ track: audioVideoTrack.kind }))
  //     // }

  //     // // if there is a audio track start sending it to the server
  //     // if (audioTrack) {
  //     //   const audioProducer = await peer.sendTransport.produce({ track: audioTrack })
  //     //   peer.producers.push(audioProducer)
  //     // }
  //   } catch (ex) {
  //     console.log('-------------', ex)
  //   }
  // }

  // async function createConsumer(consumerId) {
  //   const data = await new Promise((resolve, reject) => {
  //     socket.emit('createConsumer', { producerId: producer.id, rtpCapabilities: transport.rtpCapabilities }, resolve)
  //   })
  //   const { kind, rtpParameters, type } = data
  //   const newConsumer = await transport.consume({
  //     id: consumerId,
  //     producerId: producer.id,
  //     kind,
  //     rtpParameters,
  //     type,
  //   })
  //   return newConsumer
  // }

  // function handleError(err) {
  //   console.error(err)
  //   setError(err)
  // }
  // const getMediaStream = async () => {
  //   const mediaStream = await GUM()

  //   videoRef.srcObject = mediaStream

  //   // Get the video and audio tracks from the media stream
  //   // const videoTrack = mediaStream.getVideoTracks()[0]
  //   // const audioTrack = mediaStream.getAudioTracks()[0]

  //   // If there is a video track start sending it to the server
  //   // if (videoTrack) {
  //   //   const videoProducer = await peer.sendTransport.produce({ track: videoTrack })
  //   //   peer.producers.push(videoProducer)
  //   // }

  //   // // if there is a audio track start sending it to the server
  //   // if (audioTrack) {
  //   //   const audioProducer = await peer.sendTransport.produce({ track: audioTrack })
  //   //   peer.producers.push(audioProducer)
  //   // }

  //   // Enable the start record button
  //   // setEnableRecording(true)
  // }

  // async function startSending() {
  //   const stream = await navigator.mediaDevices.getUserMedia({
  //     video: true,
  //     audio: true,
  //   })
  //   const track = stream.getVideoTracks()[0]
  //   const params = { track }
  //   const { id } = await socket.emit('produce', params)
  //   const sender = await transport.produce({
  //     id,
  //     kind: track.kind,
  //     track,
  //     rtpParameters: await device.getRtpParametersForTrack(track),
  //   })
  // }
  // async function joinRoom(roomId) {
  //   const { peers } = await socket.emit('join', roomId)
  //   // Iterate over all existing peers and create consumers for them
  //   for (const peer of peers) {
  //     if (peer.producerId) {
  //       createConsumer(peer)
  //     }
  //   }
  // }
  // // async function createConsumer(peer) {
  // //   const { producerId } = peer
  // //   const { rtpCapabilities } = device
  // //   const { consumerTransportId, params } = await socket.emit('consume', producerId, rtpCapabilities)
  // //   const mediasoupTransport = device.createRecvTransport(recvTransportOptions)
  // //   await mediasoupTransport.connect({
  // //     dtlsParameters: consumerTransport.dtlsParameters,
  // //   })
  // //   const consumer = await mediasoupTransport.consume({
  // //     id: params.id,
  // //     producerId,
  // //     kind: params.kind,
  // //     rtpParameters: params.rtpParameters,
  // //   })
  // //   // Add the consumer's track to the DOM
  // //   const stream = new MediaStream([consumer.track])
  // //   const videoElement = document.createElement('video')
  // //   videoElement.srcObject = stream
  // //   document.body.appendChild(videoElement)
  // // }

  return (
    <SocketContext.Provider value={{ transport, producer, socket, error, videoRef }}>{children}</SocketContext.Provider>
  )
}

export default SocketProvider
