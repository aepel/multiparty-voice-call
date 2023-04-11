import { useContext, useEffect, useState } from 'react'
import Mediasoup from '../mediasoup'
import { SocketContext } from '../context/SocketContext'
import RoomClient from '../lib/roomClient'

const DEFAULT_ROOM = 'THEROOM'
const useMeeting = (
  localVideoRef,
  newConsumerEventCallback,
  removeConsumerEventCallback,
  videoContainer,
  userName = 'Ariel' + parseInt(Math.random() * 1000, 10).toString(),
  room_Id = DEFAULT_ROOM
) => {
  let localStream
  const { socket } = useContext(SocketContext)
  const mediasoup = new Mediasoup(socket, newConsumerEventCallback)
  const [videoDevices, setVideoDevices] = useState()
  const [audioDevices, setAudioDevices] = useState()
  const [room, setRoom] = useState(null)

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

  const initilizeCall = async () => {
    await initEnumerateDevices()
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
        DEFAULT_ROOM,
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
    console.log('🚀 ~ file: useMeeting.js:51 ~ enumerateDevices ~ devices:', devices)
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
  return { joinRoom, callerId: socket.id, videoDevices, audioDevices, initilizeCall }
}
export default useMeeting
