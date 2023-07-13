import Mediasoup from './mediasoup/'
const mediaType = {
  audio: 'audioType',
  video: 'videoType',
  screen: 'screenType',
}

class RoomClient {
  constructor(
    localMediaRef,
    socket,
    room_id,
    name,
    newConsumerEventCallback,
    removeConsumerCallback,
    roomCreatedSuccessfullyCallback
  ) {
    this.name = name

    this.room_id = room_id
    this.socket = socket
    this.localMediaRef = localMediaRef
    this._isOpen = false
    this.eventListeners = new Map()
    this.mediaSoup = new Mediasoup(socket, localMediaRef)
    this.newConsumerEventCallback = newConsumerEventCallback
    this.removeConsumerCallback = removeConsumerCallback
    this.mixingStream = new MediaStream()
    this.createRoom(room_id).then(async () => {
      await this.join(name, room_id)
      this.initSockets()
      this._isOpen = true
      if (roomCreatedSuccessfullyCallback) roomCreatedSuccessfullyCallback()
    })
  }

  async request(type, data = {}) {
    return new Promise((resolve, reject) => {
      this.socket.emit(type, data, data => {
        if (data.error) {
          reject(data.error)
        } else {
          resolve(data)
        }
      })
    })
  }
  ////////// INIT /////////

  async createRoom(room_id) {
    console.log('Create room:' + room_id)
    await this.request('createRoom', {
      room_id,
    }).catch(err => {
      console.log('Create room error:', err)
    })
    console.log('Create room:' + room_id + 'Created')
  }

  async join(name, room_id) {
    let roomName = await this.request('join', {
      name,
      room_id,
    }).catch(err => {
      console.log('Join error:', err)
    })

    console.log('Joined to room', roomName)
    this.mediaSoup.connect(roomName)
  }

  initSockets() {
    this.socket.on('consumerClosed', ({ consumer_id }) => {
      console.log('Closing consumer:', consumer_id)
      this.removeConsumer(consumer_id)
    })

    /**
     * data: [ {
     *  producer_id:
     *  producer_socket_id:
     * }]
     */
    this.socket.on('newProducers', async data => {
      console.log('New producers', data)
      for (let { producer_id, participantName } of data) {
        await this.mediaSoup.consume(producer_id, participantName, this.newConsumerEventCallback)
      }
    })

    this.socket.on('disconnect', () => {
      this.exit(true)
    })
  }

  //////// MAIN FUNCTIONS /////////////

  async produce(type, deviceId = null) {
    const { stream, audio, screen, producerId } = await this.mediaSoup.produce(type, deviceId)

    if (!audio && !screen) {
      this.localMediaRef.current.srcObject = stream
      this.localMediaRef.current.id = producerId
    }
  }

  async consume(producer_id, participantName) {
    await this.mediaSoup.consume(producer_id, participantName, this.newConsumerEventCallback)
  }

  closeProducer(type) {
    this.mediaSoup.closeProducer(type)
  }

  pauseProducer(type) {
    this.mediaSoup.pauseProducer(type)
  }

  resumeProducer(type) {
    this.mediaSoup.resumeProducer(type)
  }

  removeConsumer(consumer_id) {
    try{

    
    this.mediaSoup.removeConsumer(consumer_id)
    console.log("calling callback for removing")
    this.removeConsumerCallback({ consumerId: consumer_id })
    }catch(err){
      console.log('removing consumer error',err)
    }
  }

  exit(offline = false) {
    let clean = () => {
      console.log('exit room clean method')
      this._isOpen = false
      this.socket.off('disconnect')
      this.socket.off('newProducers')
      this.socket.off('consumerClosed')
      this.mediaSoup.exit(true)
    }

    if (!offline) {
      console.log("exit room")
      this.request('exitRoom')
        .then(e => console.log(e))
        .catch(e => console.warn(e))
        .finally(() => clean())
    } else {
      console.log("exit room clean")  
      clean()
    }
  }

  ///////  HELPERS //////////

  async roomInfo() {
    let info = await this.request('getMyRoomInfo')
    return info
  }
  static get mediaType() {
    return mediaType
  }
  //////// GETTERS ////////

  isOpen() {
    return this._isOpen
  }

  isRecording() {
    return this._isRecording
  }
  async startRecordingCall(stream) {
    this.socket.emit('startRecording')
  }
  async stopRecordingCall() {
    this.socket.emit('stopRecording')
  }
}

export default RoomClient
