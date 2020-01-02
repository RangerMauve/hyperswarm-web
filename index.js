const { EventEmitter } = require('events')
const webRTCSwarm = require('@geut/discovery-swarm-webrtc')
const HyperswarmClient = require('hyperswarm-proxy-ws/client')
const DuplexPair = require('duplexpair')

const DEFAULT_WEBRTC_BOOTSTRAP = ['https://geut-webrtc-signal.herokuapp.com/']

module.exports = function swarm (opts) {
  return new HyperswarmWeb(opts)
}

class HyperswarmWeb extends EventEmitter {
  constructor (opts = {}) {
    super()
    const {
      maxPeers,
      webrtcBootstrap,
      wsProxy,
      simplePeer,
      wsReconnectDelay
    } = opts

    this.webrtcOpts = {
      maxPeers,
      simplePeer,
      bootstrap: webrtcBootstrap || DEFAULT_WEBRTC_BOOTSTRAP,
      swarm: (info) => this._handleWebRTC(info)
    }
    this.wsOpts = {
      maxPeers
    }

    if (wsReconnectDelay) {
      this.wsOpts.reconnectDelay = wsReconnectDelay
    }

    if (wsProxy) {
      this.wsOpts.proxy = wsProxy
    }

    this.isListening = false
    this.destroyed = false
  }

  _handleWS (connection, info) {
    this.emit('connection', connection, info)
  }

  _handleWebRTC (info) {
    // Create a stream to split the connectivity
    const { socket1: emittedSocket, socket2: returnedSocket } = new DuplexPair()

    // Emit one side of the stream as a connection
    this.emit('connection', emittedSocket, info)

    return returnedSocket
  }

  address () {
    // TODO: What could possibly go here?!?!?!
    return { port: 0, family: 'IPv4', address: '127.0.0.1' }
  }

  listen (port, cb) {
    if (this.isListening) return setTimeout(cb, 0)

    this.isListening = true

    this.webrtc = webRTCSwarm(this.webrtcOpts)
    this.ws = new HyperswarmClient(this.wsOpts)

    this.ws.on('connection', (connection, info) => this._handleWS(connection, info))
  }

  join (key, opts) {
    this.listen()

    this.webrtc.join(key)
    this.ws.join(key, opts)
  }

  leave (key) {
    this.listen()

    this.webrtc.leave(key)
    this.ws.leave(key)
  }

  connect (peer, cb) {
    this.listen()

    this.ws.connect(peer, cb)
  }

  connectivity (cb) {
    this.listen(() => {
      cb(null, {
        bound: true,
        bootstrapped: true,
        holepunched: true
      })
    })
  }

  destroy (cb) {
    this.destroyed = true
    this.webrtc.close(() => {
      this.ws.destroy(cb)
    })
  }
}
