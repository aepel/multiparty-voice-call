// Class to hold peer data

module.exports = class Peer {
  constructor(sessionId, roomName) {
    this.sessionId = sessionId
    this.roomName = roomName
    this.transports = []
    this.producers = []
    this.consumers = []
    this.process = undefined
    this.remotePorts = []
    this.peerDetails = {
      name: '',
      isAdmin: false, // Is this Peer the Admin?
    }
  }

  addTransport(transport) {
    this.transports.push(transport)
  }

  getTransport(transportId) {
    return this.transports.find(transport => transport.id === transportId)
  }
  getTransports() {
    return this.transports
  }
  addProducer(producer) {
    this.producers.push(producer)
  }
  addConsumer(consumer) {
    this.consumers.push(consumer)
  }

  getProducer(producerId) {
    return this.producers.find(producer => producer.id === producerId)
  }
  getProducers() {
    return this.producers
  }

  getProducersByKind(kind) {
    return this.producers.filter(producer => producer.kind === kind)
  }

  getConsumersByKind(kind) {
    return this.consumers.filter(consumer => consumer.kind === kind)
  }
}
