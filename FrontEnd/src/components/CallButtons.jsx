import React from 'react'
import Button from '@mui/material/Button'
import RoomClient from '../lib/roomClient'
import { Grid } from '@mui/material'
import RecordButtons from './RecordButtons'
import MediaDevices from './MediaDevices'

const CallButtons = ({ room, videoDeviceId, audioDeviceId, onVideoDeviceSelected, onAudioDeviceSelected }) => {
  console.log('room', room)
  if (room)
    return (
      <Grid container spacing={2} style={{ margin: '20px' }}>
        <Grid item xs={2}>
          <Button variant="contained" color="secondary" id="exitButton" onClick={() => room.exit}>
            <i className="fas fa-arrow-left"></i> Exit
          </Button>
        </Grid>
        {/* <Button variant="contained" color="secondary" id="copyButton"  onclick="rc.copyURL()">
          <i className="far fa-copy"></i> copy URL
        </Button> */}
        <Grid item xs={2}>
          <Button
            variant="contained"
            color="secondary"
            id="startAudioButton"
            onClick={() => room.produce(RoomClient.mediaType.audio, audioDeviceId)}
          >
            <i className="fas fa-volume-up"></i> Open audio
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            color="secondary"
            id="stopAudioButton"
            onClick={() => room.closeProducer(RoomClient.mediaType.audio)}
          >
            <i className="fas fa-volume-up"></i> Close audio
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            color="secondary"
            id="startVideoButton"
            onClick={() => room.produce(RoomClient.mediaType.video, videoDeviceId)}
          >
            <i className="fas fa-camera"></i> Open video
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            color="secondary"
            id="stopVideoButton"
            onClick={() => room.closeProducer(RoomClient.mediaType.video)}
          >
            <i className="fas fa-camera"></i> Close video
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            color="secondary"
            id="startScreenButton"
            onClick={() => room.produce(RoomClient.mediaType.screen)}
          >
            <i className="fas fa-desktop"></i> Open screen
          </Button>
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            color="secondary"
            id="stopScreenButton"
            onClick={() => room.closeProducer(RoomClient.mediaType.screen)}
          >
            <i className="fas fa-desktop"></i> Close screen
          </Button>
        </Grid>
        <RecordButtons room={room}></RecordButtons>
        <MediaDevices
          videoDeviceSelected={videoDeviceId}
          setAudioDeviceSelected={onAudioDeviceSelected}
          setVideoDeviceSelected={onVideoDeviceSelected}
          audioDeviceSelected={audioDeviceId}
        ></MediaDevices>
      </Grid>
    )
}
export default CallButtons
