import React, { useRef } from 'react'

import useMeeting from '../hooks/useMeeting'
const Test = () => {
  const videoRef = useRef()
  // const { getLocalStream } = useMeeting(videoRef)

  // Initialize Mediasoup device

  // Join the room and start sending our stream
  const getLocalStream = () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: true,
      })
      .catch(error => {
        console.log(error.message)
      })
      .then(streamSuccess => {
        videoRef.srcObject = streamSuccess

        console.log('🚀 ~ file: useMeeting.js:31 ~ getLocalStream ~ streamSuccess:', streamSuccess)
      })
  }
  getLocalStream()
  return (
    <>
      {' '}
      <video ref={videoRef} autoPlay playsInline width={600} height={600} style={{ border: '1px solid' }} />
    </>
  )
}

export default Test
