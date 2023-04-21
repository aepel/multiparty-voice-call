import React, { useState, useRef } from 'react'
import { faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Participant/Participant.css'
const Streamer = ({ kind, stream, id, showAvatar, currentParticipant }) => {
  const videoRef = useRef()
  useState(() => {
    console.log('producerId', currentParticipant)
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
          {/* {!audio && <FontAwesomeIcon className="muted" icon={faMicrophoneSlash} title="Muted" />} */}
          {showAvatar && <div className="avatar">{currentParticipant}</div>}
          <div className="name">{currentParticipant}</div>
          <h6>{currentParticipant}</h6>
        </>
      )}
    </>
  )
}

export default Streamer
