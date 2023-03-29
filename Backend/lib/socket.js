const {
  setUpMediaSoupServer,
  createConsumer,
  createProducer,
  createTransport,
  connectTransport,
  recordVideo,
} = require('./mediasoup')
const { Server } = require('socket.io')

const { startRecording, stopRecording, disconnect } = require('./recording')
const { v4: uuidv4 } = require('uuid')
module.exports = async server => {
  const io = new Server(server, {
    cors: {
      origin: ['*', 'http://172.27.250.147:3001'],
    },
  })

  // Set up the socket.io connection
  const router = await setUpMediaSoupServer()
  io.on('connection', socket => {
    console.log('a user connected', socket)
    socket.peerId = uuidv4()
    console.log('the socket has the peer id', socket)

    // Create a new mediasoup transport for the new client
    let transport = null
    socket.on('createTransport', async (data, callback) => createTransport(data, callback, router, transport))

    // Connect the transport to the client
    socket.on('connectTransport', async (data, callback) => connectTransport(data, callback, transport))

    // Create a new mediasoup producer for the client
    let producer = null
    socket.on('createProducer', async (data, callback) => createProducer(data, callback, transport, producer))

    // Create a new mediasoup consumer for the client
    socket.on('createConsumer', async (data, callback) => createConsumer(data, callback, transport, producer, socket))

    // Listen for incoming media from the client
    socket.on('recordVideo', recordVideo)
    // Start recording
    let stream = null
    socket.on('startRecording', startRecording(stream, transport, router))

    // Stop recording and save the file
    socket.on('stopRecording', stopRecording(stream))

    // Disconnect the client and remove their mediasoup objects
    socket.on('disconnect', disconnect(producer, transport))
  })
}
