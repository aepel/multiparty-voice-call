import React, { useRef, useEffect, createRef, useState } from 'react'

import useMeeting from '../hooks/useMeeting'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

const Test = () => {
  const localVideoRef = useRef()

  const [callers, setCallers] = useState([])
  // Esto despues se usa asi ref={elementsRef.current[index]}
  const remoteVideoRef = useRef(callers.map(() => createRef()))
  const [connectionId, setConnectionId] = useState([])
  const addVideoBoxCallBack = React.useCallback(
    ({ kind, producerId, stream }) => {
      console.log('agregando stream', [...callers, { producerId, stream, kind }])
      setCallers(prevCallers => [...prevCallers, { producerId, stream, kind }])
      console.log('remoteVideoRef', remoteVideoRef)
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
      <Grid item alignContent="center" xs={6}>
        <h1>{callerId}</h1>
      </Grid>
      <Grid item xs={6}>
        <video ref={localVideoRef} autoPlay playsInline width={300} height={300} style={{ border: '1px solid' }} />
      </Grid>
      <Grid container spacing={2}>
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
                <source stream={caller.stream}></source>
              </video>
            )
          })}
        </Grid>
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
