import React, { useRef, useEffect } from 'react'

import useMeeting from '../hooks/useMeeting'
import Button from '@mui/material/Button'
const Test = () => {
  const localVideoRef = useRef()
  const remoteVideoRef = useRef()
  const { getLocalStream, joinRoom } = useMeeting(localVideoRef, remoteVideoRef)

  // Initialize Mediasoup device

  // Join the room and start sending our stream
  useEffect(() => {
    getLocalStream()
  })

  const onMeetingClick = () => {
    joinRoom().catch(err => console.log(err))
    remoteVideoRef.visible = true
  }

  return (
    <>
      {' Video de origen'}
      <video ref={localVideoRef} autoPlay playsInline width={600} height={600} style={{ border: '1px solid' }} />
      <br></br>
      <Button variant="contained" color="warning" onClick={onMeetingClick}>
        Connectar
      </Button>
      {' Video remoto'}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        width={600}
        height={600}
        visible={false}
        style={{ border: '1px solid' }}
      />
    </>
  )
}

export default Test
