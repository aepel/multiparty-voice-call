import { useContext, useState } from 'react'
import { SocketContext } from '../context/SocketContext'
import RoomClient from '../lib/roomClient'

const DEFAULT_ROOM = 'THEROOM'
const useMeeting = (
  localVideoRef,
  newConsumerEventCallback,
  removeConsumerEventCallback,
  userName = 'ID_' + parseInt(Math.random() * 1000, 10).toString(),
  room_Id = DEFAULT_ROOM
) => {
  const { socket } = useContext(SocketContext)
  const [videoDevices, setVideoDevices] = useState()
  const [audioDevices, setAudioDevices] = useState()
  const [room, setRoom] = useState(null)

  const initilizeCall = async () => {
    await initEnumerateDevices()
  }

  const sendStreamToServer = (data) => {
    socket.emit('send-stream', {data, roomId:room.room_id})
  
  }
  const joinRoom = async deviceId => {
    let rc
    if (room?.isOpen()) {
      console.log('Already connected to a room')
    } else {
      initEnumerateDevices()

      console.log('🚀 ~ file: useMeeting.js:45 ~ joinRoom ~ socket:', socket)
      rc = new RoomClient(
        localVideoRef,
        socket,
        room_Id,
        userName,
        newConsumerEventCallback,
        removeConsumerEventCallback
      )
      setRoom(rc)
    }

    return rc
  }
  const isAudioDevice = kind => 'audioinput' === kind
  const isVideoDevice = kind => 'videoinput' === kind
  const enumerateDevices = async () => {
    // Load mediaDevice options
    const devices = await navigator.mediaDevices.enumerateDevices()
    const vidDevices = []
    const audDevices = []
    devices.forEach(device => {
      const dev = { deviceId: device.deviceId, label: device.label }
      if (isAudioDevice(device.kind)) {
        audDevices.push(dev)
      } else if (isVideoDevice(device.kind)) {
        vidDevices.push(dev)
      }
    })
    setVideoDevices([...vidDevices])
    setAudioDevices([...audDevices])
  }
  const initEnumerateDevices = async () => {
    // Many browsers, without the consent of getUserMedia, cannot enumerate the devices.
    enumerateDevices()
    if (!(audioDevices && videoDevices)) return
    const constraints = {
      audio: audioDevices?.length > 0,
      video: videoDevices?.length > 0,
    }
    console.log('🚀 ~ file: useMeeting.js:63 ~ initEnumerateDevices ~ s:', constraints)

    const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(err => {
      console.error('Access denied for audio/video: ', err)
    })

    stream.getTracks().forEach(track => {
      track.stop()
    })
  }
  return { joinRoom, callerId: userName, videoDevices, audioDevices, initilizeCall,sendStreamToServer }
}
export default useMeeting
