import React, { useState, useRef } from 'react'
import Card from '../../Shared/Card/Card.component'
import { faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import './Participant.css'

export const Participant = ({
  participantId,
  currentParticipant,
  hideVideo,
  showAvatar,
  currentUser,
  kind,
  stream,
}) => {
  const videoRef = useRef()
  useState(() => {
    console.log('producerId', participantId)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    }, 2000)
  }, [videoRef.current, stream])
  if (!currentParticipant) return <></>
  return (
    <div className={`participant ${hideVideo ? 'hide' : ''}`}>
      <>
        <video ref={videoRef} className="video" id={`participantVideo${participantId}`} autoPlay playsInline></video>
        {!currentParticipant.audio && <FontAwesomeIcon className="muted" icon={faMicrophoneSlash} title="Muted" />}
        {showAvatar && (
          <div style={{ background: currentParticipant.avatarColor }} className="avatar">
            {currentParticipant.name[0]}
          </div>
        )}
        <div className="name">
          {currentParticipant.name}
          {currentUser ? '(You)' : ''}
        </div>
      </>
    </div>
  )
}
