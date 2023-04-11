// Require the necessary modules
const express = require('express')
const app = express()
const https = require('https')
const fs = require('fs')
const setUpSocketIo = require('./lib/socket')
const cors = require('cors')
const compression = require('compression')
const bodyParser = require('body-parser')
const videoCallService = require('./lib/services/videoCallService')
const path = require('path')
const main = async () => {
  // Set up the Express server
  app.use(cors())
  app.use(compression())
  app.use(express.json())
  // app.use(express.static(dir.public))
  app.use(bodyParser.urlencoded({ extended: true }))

  app.get('/', (req, res) => {
    res.send('Server up and running')
  })

  const options = {
    key: fs.readFileSync(path.join(__dirname, 'server/ssl/server.key'), 'utf-8'),
    cert: fs.readFileSync(path.join(__dirname, 'server/ssl/server.crt'), 'utf-8'),
  }
  // Start the server
  const server = https.createServer(options, app)

  console.log(`socket IO configured`)
  const PORT = process.env.PORT || 3000
  await videoCallService.initializeConnectivity(server)
  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
    console.log(`https://localhost:${PORT}`)
  })
}

module.exports = main
