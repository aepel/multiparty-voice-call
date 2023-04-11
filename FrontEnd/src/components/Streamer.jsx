import React, { useState, useRef } from 'react'

const Streamer = ({ kind, stream, id }) => {
  const videoRef = useRef()
  useState(() => {
    console.log('producerId', id)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    }, 2000)
  }, [videoRef.current, stream])
  return (
    <>
      {kind === 'audio' ? (
        <audio key={id} id={id} autoPlay ref={videoRef}></audio>
      ) : (
        <>
          <h5>{id}</h5>
          <video
            key={id}
            id={id}
            playsInline
            width={300}
            height={300}
            autoPlay
            className="video"
            style={{ border: '1px solid' }}
            ref={videoRef}
          ></video>
        </>
      )}
    </>
  )
}

export default Streamer
