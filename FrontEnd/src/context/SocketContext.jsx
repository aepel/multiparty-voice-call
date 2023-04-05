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
    socket.connect()
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
  const isConnected = () => !socket.connected || !socket.connecting
  const reconnect = () => (!socket.connected || !socket.connecting ? socket.connect() : null)

  return (
    <SocketContext.Provider value={{ transport, producer, socket, error, videoRef, isConnected, reconnect }}>
      {children}
    </SocketContext.Provider>
  )
}

export default SocketProvider
