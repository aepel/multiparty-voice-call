import React, { useRef, useEffect, useCallback, useState } from 'react'

import useMeeting from '../hooks/useMeeting'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Streamer from './Streamer'
import uniqBy from 'lodash/uniqBy'
import remove from 'lodash/remove'

import CallButtons from './CallButtons'
import { useParams } from 'react-router-dom'

const Test = () => {
  const localVideoRef = useRef()
  const { roomName, userName } = useParams()

  const [callers, setCallers] = useState([])
  const [videoDeviceSelected, setVideoDeviceSelected] = useState('')
  const [audioDeviceSelected, setAudioDeviceSelected] = useState('')
  const [room, setRoom] = useState(null)
  const [connectionId, setConnectionId] = useState([])

  const addVideoBoxCallBack = useCallback(
    ({ kind, consumerId, stream, participantName }) => {
      console.log('agregando stream', [...callers, { consumerId, stream, kind, participantName }])
      setCallers(prevCallers => {
        const elements = [...prevCallers, { consumerId, stream, kind, participantName }]
        return uniqBy(elements, el => el.consumerId)
      })
    },
    [setCallers, callers]
  )
  const removeVideoBoxCallBack = useCallback(
    ({ kind, consumerId, stream }) => {
      setCallers(prevCallers => {
        console.log('🚀 ~ file: Test.jsx:41 ~ Test ~ prevCallers:', prevCallers)
        return remove(prevCallers, el => el.consumerId)
      })
    },
    [setCallers, callers]
  )
  const { joinRoom, callerId, initilizeCall, videoDevices, audioDevices } = useMeeting(
    localVideoRef,
    addVideoBoxCallBack,
    removeVideoBoxCallBack,
    userName,
    roomName
  )
  useEffect(() => {
    console.log('Entre', userName, roomName)
    initilizeCall().catch(err => console.log(err))
    if (videoDevices) {
      const [defaultValue] = videoDevices
      setVideoDeviceSelected(defaultValue.deviceId)
    }
    if (audioDevices) {
      const [defaultValue] = audioDevices
      setAudioDeviceSelected(defaultValue.deviceId)
    }
  }, [])
  const onMeetingClick = () => {
    console.log('meeting click', callerId, connectionId)
    joinRoom()
      .then(room => {
        setRoom(room)
      })
      .catch(err => console.log(err))
    setConnectionId(callerId)
  }

  return (
    <Grid container spacing={2}>
      <Grid item alignContent="center" xs={12}>
        <h1>Hi, {userName}!</h1>
      </Grid>
      {room ? (
        <Grid container>
          <CallButtons
            room={room}
            videoDeviceId={videoDeviceSelected}
            audioDeviceId={audioDeviceSelected}
            onAudioDeviceSelected={setAudioDeviceSelected}
            onVideoDeviceSelected={setVideoDeviceSelected}
          ></CallButtons>
        </Grid>
      ) : (
        false
      )}

      <Grid item xs={4}>
        <video ref={localVideoRef} autoPlay playsInline width={300} height={300} style={{ border: '1px solid' }} />
      </Grid>
      <Grid item xs={4}></Grid>
      <Grid container spacing={2}>
        {callers.map(({ stream, producerId: consumerId, kind }) => (
          <Grid item xs={4}>
            <Streamer kind={kind} stream={stream} id={consumerId} />
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
