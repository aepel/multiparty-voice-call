import React, { useRef, useEffect, createRef, useState } from 'react'

import useMeeting from '../hooks/useMeeting'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Streamer from './Streamer'
import uniqBy from 'lodash/uniqBy'
import remove from 'lodash/remove'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import Select, { SelectChangeEvent } from '@mui/material/Select'
import CallButtons from './CallButtons'
const Test = () => {
  const localVideoRef = useRef()
  const videoRef = useRef()
  const VideoContainer = useRef()

  const [callers, setCallers] = useState([])
  const [videoDeviceSelected, setVideoDeviceSelected] = useState('')
  const [audioDeviceSelected, setAudioDeviceSelected] = useState('')
  const [room, setRoom] = useState(null)
  // Esto despues se usa asi ref={elementsRef.current[index]}
  const [connectionId, setConnectionId] = useState([])
  const addVideoBoxCallBack = React.useCallback(
    ({ kind, consumerId, stream }) => {
      console.log('agregando stream', [...callers, { consumerId, stream, kind }])
      setCallers(prevCallers => {
        const elements = [...prevCallers, { consumerId, stream, kind }]
        return uniqBy(elements, el => el.consumerId)
      })
    },
    [setCallers, callers]
  )
  const removeVideoBoxCallBack = React.useCallback(
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
    removeVideoBoxCallBack
  )
  useEffect(() => {
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
        <h1>Hi, {callerId}!</h1>
      </Grid>
      {room ? (
        <Grid container>
          <CallButtons
            room={room}
            videoDeviceId={videoDeviceSelected}
            audioDeviceId={audioDeviceSelected}
          ></CallButtons>
        </Grid>
      ) : null}
      <Grid item xs={4}>
        {videoDevices ? (
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-helper-label">Video Devices</InputLabel>
            <Select
              displayEmpty={false}
              value={videoDeviceSelected}
              labelId="demo-simple-select-helper-label"
              id="demo-simple-select-helper"
              label="Video Devices"
              onChange={val => setVideoDeviceSelected(val.target.value)}
            >
              {videoDevices.map((device, index) => (
                <MenuItem defaultValue={index === 0} value={device.deviceId} key={device.deviceId}>
                  {device.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Grid>
      <Grid item xs={4}>
        {audioDevices ? (
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel id="demo-simple-select-helper-label">Audio Devices</InputLabel>
            <Select
              value={audioDeviceSelected}
              displayEmpty={false}
              labelId="demo-simple-select-helper-label"
              id="demo-simple-select-helper"
              label="Video Devices"
              onChange={val => {
                console.log(val)
                setAudioDeviceSelected(val.target.value)
              }}
            >
              {audioDevices.map((device, index) => (
                <MenuItem defaultValue={index === 0} value={device.deviceId} key={device.deviceId}>
                  {device.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : null}
      </Grid>
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
