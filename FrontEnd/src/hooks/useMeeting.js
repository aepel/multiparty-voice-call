import React, { useState, useRef, useContext } from 'react'
import Peer from '../helpers/peer'
import SocketProvider, { SocketContext } from '../context/SocketContext'
const useMeeting = () => {
  const [stream, setStream] = useState(null)
  const [recorder, setRecorder] = useState(null)
  const [chunks, setChunks] = useState([])
  const [me, setMe] = useState('')
  const [name, setName] = useState('')

  const [caller, setCaller] = useState('')
  const [callerSignal, setCallerSignal] = useState()
  const [callAccepted, setCallAccepted] = useState(false)
  const [idToCall, setIdToCall] = useState('')
  const [callEnded, setCallEnded] = useState(false)
  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef()
  const context = useContext(SocketContext)
  console.log(context)
  const { socket } = context
  const callUser = id => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    })
    peer.on('signal', data => {
      socket.emit('callUser', {
        userToCall: id,
        signalData: data,
        from: me,
        name: name,
      })
    })
    peer.on('stream', stream => {
      userVideo.current.srcObject = stream
    })
    socket.on('callAccepted', signal => {
      setCallAccepted(true)
      peer.signal(signal)
    })

    connectionRef.current = peer
  }

  const startRecording = () => {
    recorder.start()
  }

  const stopRecording = () => {
    recorder.stop()
  }

  const answerCall = () => {
    setCallAccepted(true)
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    })
    peer.on('signal', data => {
      socket.emit('answerCall', { signal: data, to: caller })
    })
    peer.on('stream', stream => {
      userVideo.current.srcObject = stream
    })

    peer.signal(callerSignal)
    connectionRef.current = peer
  }

  const leaveCall = () => {
    setCallEnded(true)
    connectionRef.current.destroy()
  }
  return {
    leaveCall,
    answerCall,
    startRecording,
    stopRecording,
    callUser,
    myVideo,
    userVideo,
    connectionRef,
  }
}
export default useMeeting
