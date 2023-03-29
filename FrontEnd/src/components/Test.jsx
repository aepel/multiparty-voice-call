import React, { useContext } from 'react'
import { SocketContext } from '../context/SocketContext'
import useMeeting from '../hooks/useMeeting'
const Test = () => {
  const { transport, device, videoRef } = useContext(SocketContext)

  // Initialize Mediasoup device

  // Join the room and start sending our stream

  return (
    <>
      {' '}
      <video ref={videoRef} autoPlay playsInline width={600} height={600} style={{ border: '1px solid' }} />
    </>
  )
}

export default Test
