const { forEach } = require('lodash')

module.exports = class Room {
  #consumers = {}
  #producers = {}
  constructor(router, roomName) {
    this.router = router
    this.roomName = roomName
    this.peers = {}
  }
  addPeer(peer) {
    this.peers[peer.socketId] = peer
  }
  getPeers() {
    return Object.values(this.peers)
  }
  getPeer(peerId) {
    return this.peers[peerId]
  }
  getRouter() {
    return this.router
  }
  addConsumer(consumer, socketId) {
    consumer.socketId = socketId
    this.#producers[consumer.id] = consumer
  }
  addProducer(producer, socketId) {
    producer.socketId = socketId
    this.#producers[producer.id] = producer
  }
  removeProducers(producersToDelete) {
    forEach(producersToDelete, ({ id }) => delete this.#producers[id])
  }
  removeConsumers(consumersToDelete) {
    forEach(consumersToDelete, ({ id }) => delete this.#consumers[id])
  }
  get producers() {
    return Object.values(this.#producers)
  }
  get consumers() {
    return Object.values(this.#consumers)
  }
}
