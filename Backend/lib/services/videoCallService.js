const { createWorkers, createRouter } = require('../mediasoup')
const setUpSocketIo = require('../socket')

const initializeConnectivity = async server => {
  await createWorkers()

  await setUpSocketIo(server, createRouter).catch(err => console.error(err))
}

module.exports = {
  initializeConnectivity,
}
