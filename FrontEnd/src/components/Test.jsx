import React, { useRef, useEffect, useState } from 'react'

import useMeeting from '../hooks/useMeeting'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import { connect } from 'socket.io-client'

const Test = () => {
  const localVideoRef = useRef()
  const [callers, setCallers] = useState([])
  const [connectionId, setConnectionId] = useState([])
  const addVideoBoxCallBack = React.useCallback(({ kind, producerId, stream }) => {
    if (!callers.includes(producerId)) {
      console.log('agregando stream', [...callers, { producerId, stream, kind }])
      setCallers([...callers, { producerId, stream, kind }])
    }
  })
  const { joinRoom, callerId } = useMeeting(localVideoRef, addVideoBoxCallBack)

  // Initialize Mediasoup device

  // // Join the room and start sending our stream
  // useEffect(() => {
  //   console.log('meeting click')
  //   joinRoom().catch(err => console.log(err))
  // })

  const onMeetingClick = () => {
    console.log('meeting click', callerId, connectionId)
    joinRoom().catch(err => console.log(err))
    setConnectionId(callerId)
  }
  console.log('🚀 ~ file: Test.jsx:36 ~ onMeetingClick ~ callerId:', callerId)

  return (
    <Grid container spacing={2}>
      <Grid item alignContent="center" xs={6}>
        <h1>{connectionId}</h1>
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
