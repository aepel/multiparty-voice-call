import React, { useRef, useEffect, createRef, useState } from 'react'

import useMeeting from '../hooks/useMeeting'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Streamer from './Streamer'

const Test = () => {
  const localVideoRef = useRef()

  const [callers, setCallers] = useState([])
  // Esto despues se usa asi ref={elementsRef.current[index]}
  const [connectionId, setConnectionId] = useState([])
  const addVideoBoxCallBack = React.useCallback(
    ({ kind, producerId, stream }) => {
      console.log('agregando stream', [...callers, { producerId, stream, kind }])
      setCallers(prevCallers => [...prevCallers, { producerId, stream, kind }])
    },
    [setCallers, callers]
  )
  const { joinRoom, callerId } = useMeeting(localVideoRef, addVideoBoxCallBack)

  const onMeetingClick = () => {
    console.log('meeting click', callerId, connectionId)
    joinRoom().catch(err => console.log(err))
    setConnectionId(callerId)
  }

  return (
    <Grid container spacing={2}>
      <Grid item alignContent="center" xs={12}>
        <h1>Hi, {callerId}!</h1>
      </Grid>
      <Grid item xs={4}></Grid>
      <Grid item xs={4}>
        <video ref={localVideoRef} autoPlay playsInline width={300} height={300} style={{ border: '1px solid' }} />
      </Grid>
      <Grid item xs={4}></Grid>
      <Grid container spacing={2}>
        {callers.map(({ stream, producerId, kind }) => (
          <Grid item xs={4}>
            <Streamer kind={kind} stream={stream} id={producerId} />
          </Grid>
        ))}
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
