import { useContext, useEffect, useState } from 'react'
import Mediasoup from '../mediasoup'
import { SocketContext } from '../context/SocketContext'
const useMeeting = (localVideoRef, newConsumerEventCallback) => {
  let localStream
  const [callerId, setCallerId] = useState(null)
  const { socket } = useContext(SocketContext)
  const mediasoup = new Mediasoup(socket, newConsumerEventCallback)
  const getLocalStream = async () => {
    const streamSuccess = await navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: true,
      })
      .catch(error => {
        console.log(error.message)
      })

    localVideoRef.current.srcObject = streamSuccess
    localStream = streamSuccess
  }

  const DEFAULT_ROOM = 'THEROOM'
  const joinRoom = async (roomName = DEFAULT_ROOM) => {
    await getLocalStream()

    await mediasoup.joinRoom(roomName)

    console.log('🚀 ~ file: useMeeting.js:30 ~ joinRoom ~ localStream:', localStream)
    mediasoup.createSendTransport(localStream)
  }
  return { joinRoom, callerId: socket.id }
}
export default useMeeting
