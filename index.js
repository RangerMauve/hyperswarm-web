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
      webrtcBoostrap,
      wsProxy,
      simplePeer,
      wsReconnectDelay
    } = opts

    this.webrtcOpts = {
      maxPeers,
      simplePeer,
      boostrap: webrtcBoostrap || DEFAULT_WEBRTC_BOOTSTRAP,
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
    this.emot('connection', connection, info)
  }

  _handleWebRTC (info) {
    // Create a stream to split the connectivity
    const { socket1: emittedSocket, socket2: returnedSocket } = new DuplexPair()

    this.emit('connection', emittedSocket, info)

    return returnedSocket
  }

  address () {
    // What could possibly go here?!?!?!
  }

  listen (port, cb) {
		if(this.isListening) return setTimeout(cb, 0)

		this.isListening = true

    this.webrtc = webRTCSwarm(this.webrtcOpts)
    this.ws = new HyperswarmClient(this.wsOpts)

    this.ws.on('connection', (connection, info) => this._handleWS(connection, info))
  }

  join (key, opts) {
		this.listen()
  }

  leave (key) {
		this.listen()

  }

  connect (peer, cb) {

  }

  connectivity () {

  }

  destroy (cb) {
		this.destroyed = true
		this.webrtc.destroy(() => {
			this.ws.destroy(cb)
		})
  }
}
