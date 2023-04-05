import { useContext, useEffect, useState } from 'react'
import Mediasoup from '../mediasoup'
import { SocketContext } from '../context/SocketContext'
const useMeeting = (localVideoRef, newConsumerEventCallback) => {
  let localStream
  const [callerId, setCallerId] = useState(null)
  const { socket } = useContext(SocketContext)
  const mediasoup = new Mediasoup(socket, newConsumerEventCallback)
  const getLocalStream = () => {
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: true,
      })
      .catch(error => {
        console.log(error.message)
      })
      .then(streamSuccess => {
        localVideoRef.current.srcObject = streamSuccess
        localStream = streamSuccess

        console.log('🚀 ~ file: useMeeting.js:22 ~ getLocalStream ~ this.socket.id:', this.socket.id)
      })
  }
  useEffect(() => {
    setCallerId(socket.id)
  }, [])
  const DEFAULT_ROOM = 'THEROOM'
  const joinRoom = async (roomName = DEFAULT_ROOM) => {
    console.log('socket', socket.id)
    await mediasoup.joinRoom(roomName)
    getLocalStream()

    console.log('🚀 ~ file: useMeeting.js:30 ~ joinRoom ~ localStream:', localStream)
    await mediasoup.createSendTransport(localStream)
  }
  return { joinRoom, callerId }
}
export default useMeeting
