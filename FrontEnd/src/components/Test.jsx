import React, { useRef, useEffect, useState } from 'react'

import useMeeting from '../hooks/useMeeting'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

const Test = () => {
  const localVideoRef = useRef()
  const [callers, setCallers] = useState([])
  const addVideoBoxCallBack = React.useCallback(
    ({ kind, producerId, stream }) => {
      if (!callers.includes(producerId)) {
        setCallers([...callers, { producerId, stream, kind }])
      }
    },
    [callers]
  )
  const { getLocalStream, joinRoom } = useMeeting(localVideoRef, addVideoBoxCallBack)

  // Initialize Mediasoup device

  // Join the room and start sending our stream
  useEffect(() => {
    getLocalStream()
  })

  const onMeetingClick = () => {
    console.log('meeting click')
    joinRoom().catch(err => console.log(err))
  }

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        {' Video de origen'}
      </Grid>
      <Grid item xs={6}>
        <video ref={localVideoRef} autoPlay playsInline width={300} height={300} style={{ border: '1px solid' }} />
      </Grid>
      <Grid item xs={4}>
        {callers.map(caller => {
          console.log('caller', caller)
          return caller.kind === 'audio' ? (
            <audio key={caller.producerId} id={caller.producerId} autoplay>
              <source src={caller.stream}></source>
            </audio>
          ) : (
            <video
              key={caller.producerId}
              id={caller.producerId}
              playsInline
              width={300}
              height={300}
              autoPlay
              style={{ border: '1px solid' }}
            >
              <source src={caller.stream}></source>
            </video>
          )
        })}
      </Grid>
      <Grid item xs={12}>
        <Button variant="contained" color="warning" onClick={onMeetingClick}>
          Conectar
        </Button>
      </Grid>
    </Grid>
  )
}

export default Test
