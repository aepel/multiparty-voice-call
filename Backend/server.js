// Require the necessary modules
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const setUpSocketIo = require('./lib/socket')
const cors = require('cors')
const compression = require('compression')
const bodyParser = require('body-parser')

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

  // Start the server

  await setUpSocketIo(server).catch(err => console.error(err))
  console.log(`socket IO configured`)
  const PORT = process.env.PORT || 3000
  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`)
  })
}

module.exports = main
