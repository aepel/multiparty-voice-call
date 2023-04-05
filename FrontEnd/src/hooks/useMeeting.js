import { useContext } from 'react'
import Mediasoup from '../mediasoup'
import { SocketContext } from '../context/SocketContext'
const useMeeting = (localVideoRef, newConsumerEventCallback) => {
  let localStream

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
      })
  }
  const DEFAULT_ROOM = 'THEROOM'
  const joinRoom = async (roomName = DEFAULT_ROOM) => {
    socket.on('connection-success', ({ socketId }) => {
      console.log(socketId)
      getLocalStream()
    })
    console.log('🚀 ~ file: useMeeting.js:25 ~ joinRoom ~ joinRoom:')

    await mediasoup.joinRoom(roomName)

    await mediasoup.createSendTransport(localStream)
  }
  return { getLocalStream, joinRoom }
}
export default useMeeting
