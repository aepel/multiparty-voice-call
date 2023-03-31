const { createWorkers, createRouter } = require('../mediasoup')
const setUpSocketIo = require('../socket')
const initializeMediaSoupServer = async () => {
  await createWorkers()
}

const initializeConnectivity = async server => {
  router = initializeMediaSoupServer()

  await setUpSocketIo(server).catch(err => console.error(err))
}

module.exports = {
  initializeMediaSoupServer,
  initializeConnectivity,
}
