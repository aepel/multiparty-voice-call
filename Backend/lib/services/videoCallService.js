const { createWorkers, createRouter } = require('../mediasoup')
const setUpSocketIo = require('../socket')
let router
const initializeMediaSoupServer = async () => {
  await createWorkers()
  router = await createRouter()
  return router
}

const initializeConnectivity = async server => {
  router = initializeMediaSoupServer()
  await setUpSocketIo(server, router).catch(err => console.error(err))
}

module.exports = {
  initializeMediaSoupServer,
  initializeConnectivity,
}
