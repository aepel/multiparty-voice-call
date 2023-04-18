import { Button, Grid } from '@mui/material'
import React, { useState } from 'react'

const RecordButtons = ({ room }) => {
  const [screenShareStream, setScreenShareStream] = useState(null)

  const startScreenShare = async () => {
    try {
      // const stream = await navigator.mediaDevices.getUserMedia({
      //   video: {
      //     mediaSource: 'tab',
      //     mimeType: 'video/webm;codecs=vp9',
      //   },
      //   audio: {
      //     echoCancellation: true,
      //     noiseSuppression: true,
      //     sampleRate: 44100,
      //   },
      // })
      // setScreenShareStream(stream)

      room.startRecordingCall()
    } catch (error) {
      console.error('Error starting screen share:', error)
    }
  }

  const stopScreenShare = () => {
    // if (screenShareStream) {
    //   screenShareStream.getTracks().forEach(track => track.stop())
    //   setScreenShareStream(null)
    room.stopRecordingCall()
    // }
  }

  return (
    <>
      <Grid item xs={2}>
        {screenShareStream ? (
          <Button variant="contained" color="secondary" id="stopScreenButton" onClick={stopScreenShare}>
            <i className="fas fa-record"></i> Stop Recording
          </Button>
        ) : (
          <Button variant="contained" color="secondary" id="stopScreenButton" onClick={startScreenShare}>
            <i className="fas fa-record"></i> Start Recording
          </Button>
        )}
      </Grid>
    </>
  )
}

export default RecordButtons
