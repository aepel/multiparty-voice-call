module.exports = class Room {
  constructor(router, roomName) {
    this.router = router
    this.roomName = roomName
    this.peers = []
  }
  addPeer(peer) {
    this.peers[peer.socketId] = peer
  }
  getPeers() {
    return this.peers
  }
  getPeer(peerId) {
    return this.peers[peerId]
  }
}
