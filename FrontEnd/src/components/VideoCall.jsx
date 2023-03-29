import React, { useState, useContext } from 'react'
import SocketContext from '../context/SocketContext'

const VideoCall = ({ RecordButtons }) => {
  const [enableRecording, setEnableRecording] = useState(false)
  const [enableStopRecording, setEnableStopRecording] = useState(false)
  const { error, videoRef } = useContext(SocketContext)
  return (
    <div>
      {error && <div>Error: {error.message}</div>}
      <video ref={videoRef} autoPlay playsInline />
      <RecordButtons enableRecording={enableRecording} enableStopRecording={enableStopRecording} />
    </div>
  )
}

export default VideoCall
