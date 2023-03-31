import React, { useRef, useEffect } from 'react'

import useMeeting from '../hooks/useMeeting'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

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
    <Grid container spacing={2}>
      <Grid item xs={6}>
        {' Video de origen'}
        <video ref={localVideoRef} autoPlay playsInline width={600} height={600} style={{ border: '1px solid' }} />
      </Grid>
      <Grid item xs={6}>
        {' '}
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
      </Grid>
      <Grid item xs={3}>
        <Button variant="contained" color="warning" onClick={onMeetingClick}>
          Conectar
        </Button>
      </Grid>
      <Grid item xs={8}></Grid>
    </Grid>
  )
}

export default Test
