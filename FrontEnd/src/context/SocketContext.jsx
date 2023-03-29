import React, { createContext, useEffect, useRef, useState } from 'react'
import GUM from '../config'
import Peer from '../helpers/peer'
import io from 'socket.io-client'
const socket = io('http://localhost:3000') // Replace with your server URL

export const SocketContext = createContext({})

const SocketProvider = ({ children }) => {
  const videoRef = useRef(null)
  const [transport, setTransport] = useState(null)
  const [producer, setProducer] = useState(null)
  const [consumer, setConsumer] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('use context effect')
    // Connect to the server and create a transport
    socket.on('connect', async () => {
      console.log('onConnect')
      try {
        const data = await new Promise((resolve, reject) => {
          socket.emit('createTransport', { ip: window.location.hostname }, resolve)
        })
        const newTransport = await createTransport(data)
        setTransport(newTransport)
        console.log('Transport Created')
      } catch (err) {
        console.error(err)
        setError(err)
      }
    })

    // Create a producer when the transport is connected
    if (transport) {
      transport.on('connect', async ({ dtlsParameters }, callback) => {
        try {
          await socket.emit('connectTransport', { dtlsParameters }, callback)
          const newProducer = await createProducer(transport)
          setProducer(newProducer)
        } catch (err) {
          setError(err)
        }
      })
    }

    // Create a consumer when a new one is added
    socket.on('newConsumer', async ({ consumerId }) => {
      const newConsumer = await createConsumer(consumerId, transport)
      setConsumer(newConsumer)
    })

    // Clean up on unmount
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
  }, [transport, producer, consumer, createProducer, createConsumer])

  async function createTransport(data) {
    const { transportId, iceParameters, iceCandidates, dtlsParameters, sessionId } = data
    const newTransport = await window.mediasoupClient.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp: window.location.hostname }],
      iceParameters,
      iceCandidates,
      dtlsParameters,
    })
    setTransport(newTransport)
  }

  async function createProducer() {
    // getMediaStream()

    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true })
    const audioTrack = audioStream.getAudioTracks()[0]
    const videoTrack = videoStream.getVideoTracks()[0]
    const newProducer = await transport.produce({
      track: [audioTrack, videoTrack],
      codecOptions: {
        videoGoogleStartBitrate: 1000,
      },
    })
    setProducer(newProducer)
  }

  async function createConsumer(consumerId) {
    const data = await new Promise((resolve, reject) => {
      socket.emit('createConsumer', { producerId: producer.id, rtpCapabilities: transport.rtpCapabilities }, resolve)
    })
    const { kind, rtpParameters, type } = data
    const newConsumer = await transport.consume({
      id: consumerId,
      producerId: producer.id,
      kind,
      rtpParameters,
      type,
    })
    return newConsumer
  }

  function handleError(err) {
    console.error(err)
    setError(err)
  }
  const getMediaStream = async () => {
    const mediaStream = await GUM()

    videoRef.srcObject = mediaStream

    // Get the video and audio tracks from the media stream
    // const videoTrack = mediaStream.getVideoTracks()[0]
    // const audioTrack = mediaStream.getAudioTracks()[0]

    // If there is a video track start sending it to the server
    // if (videoTrack) {
    //   const videoProducer = await peer.sendTransport.produce({ track: videoTrack })
    //   peer.producers.push(videoProducer)
    // }

    // // if there is a audio track start sending it to the server
    // if (audioTrack) {
    //   const audioProducer = await peer.sendTransport.produce({ track: audioTrack })
    //   peer.producers.push(audioProducer)
    // }

    // Enable the start record button
    // setEnableRecording(true)
  }

  return (
    <SocketContext.Provider value={{ transport, producer, socket, error, videoRef }}>{children}</SocketContext.Provider>
  )
}

export default SocketProvider
