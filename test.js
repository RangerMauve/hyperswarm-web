const hyperswarm = require('hyperswarm')
const HyperswarmServer = require('./server')
const hyperswarmweb = require('./')
const test = require('tape')
const getPort = require('get-port')
const crypto = require('crypto')
const wrtc = require('wrtc')
const { inspect } = require('util')

let server = null
let port = null
test('Setup', async function (t) {
  // Initialize local proxy
  server = new HyperswarmServer()
  port = 4977 // await getPort() //
  server.listen(port)
  t.end()
})

test('Connect to local hyperswarm through local proxy', (t) => {
  t.plan(9)
  try {
    // Initialize local hyperswarm instance, listen for peers
    const swarm = hyperswarm({
      announceLocalAddress: true
      // ,
      // bootstrap: `localhost:${BOOTSTRAP_PORT}`
    })

    // Initialize client
    const hostname = `ws://localhost:${port}`

    const client = hyperswarmweb({
      // bootstrap: [hostname]
      announceLocalAddress: true,
      wsProxy: [hostname]
    })

    const key = crypto.randomBytes(32)

    // Test connections in regular hyperswarm
    swarm.on('connection', function (connection, info) {
      const {
        priority,
        status,
        retries,
        peer,
        client
      } = info
      t.pass('new swarm connection!', `
        priority: ${priority}
        status: ${status}
        retries: ${retries}
        client: ${client}
        peer: ${!peer
          ? peer
          : `
          ${inspect(peer, { indentationLvl: 4 }).slice(2, -2)}
        `}
      `)

      t.pass('Got connection locally')
      connection.once('end', () => {
        t.pass('Local connection ended')
        swarm.destroy()
      })
      connection.once('data', () => {
        t.pass('Local connection got data')
      })
      connection.write('Hello World')
    })

    swarm.connectivity((err, capabilities) => {
      t.pass('swarm network capabilities', capabilities, err || '')
    })
    swarm.on('peer', (peer) => {
      t.pass('new swarm peer!', `peer: ${!peer
        ? peer
        : `
      ${inspect(peer, { indentationLvl: 4 }).slice(2, -2)}
    `}
  `)
    })

    // Join channel on local hyperswarm
    swarm.join(key, {
      announce: true,
      lookup: true
    }, function () {
      // Join channel on client
      client.join(key)
    })

    // Test connections in proxied hyperswarm
    client.once('connection', (connection, info) => {
      const {
        priority,
        status,
        retries,
        peer,
        client: clnt
      } = info
      t.pass('new client connection!', `
        priority: ${priority}
        status: ${status}
        retries: ${retries}
        client: ${clnt}
        peer: ${!peer
          ? peer
          : `
          ${inspect(peer, { indentationLvl: 4 }).slice(2, -2)}
        `}
      `)
      connection.on('error', (err) => {
        // Whatever
        console.error(err)
        t.fail(err)
      })

      t.pass('Got proxied connection')
      connection.once('data', () => {
        t.pass('Proxied connection got data')
        connection.end(() => {
          t.pass('Proxied connection closed')
          client.destroy()
        })
      })

      connection.write('Hello World')
    })

    client.connectivity((err, capabilities) => {
      t.pass('client network capabilities', capabilities, err || '')
    })
  } catch (e) {
    console.error('try failed: ', e)
    t.fail(e)
  }
})

test('Connect to webrtc peers', async (t) => {
  t.plan(8)
  try {
    // Initialize client
    const hostname = `ws://localhost:${port}`
    const client1 = hyperswarmweb({
      bootstrap: [hostname],
      simplePeer: {
        wrtc
      }
    })
    const client2 = hyperswarmweb({
      bootstrap: [hostname],
      simplePeer: {
        wrtc
      }
    })

    client1.once('connection', (connection, info) => {
      t.pass('Got connection from client2')
      connection.once('end', () => {
        t.pass('Connection client1 -> client2 ended')
        client1.destroy()
      })
      connection.once('data', () => {
        t.pass('The client1 got data')
      })
      connection.write('Hello World')
    })

    client2.once('connection', (connection) => {
      connection.on('error', (e) => {
        // Whatever
        console.error(e)
        t.fail(e)
      })

      t.pass('Got connection from client1')
      connection.once('data', () => {
        t.pass('The client2 got data')
        connection.end(() => {
          t.pass('Connection client2 -> client1 ended')
          client2.destroy()
          server.destroy()
        })
      })

      connection.write('Hello World')
    })

    const key = crypto.randomBytes(32)

    // Join channel on client
    client1.join(key)
    client2.join(key)

    client1.webrtc.signal.once('connected', () => {
      t.pass('client1 should establish a websocket connection with the signal')
    })
    client2.webrtc.signal.once('connected', () => {
      t.pass('client2 should establish a websocket connection with the signal')
    })
  } catch (e) {
    console.error(e)
    t.fail(e)
  }
})

test('Teardown', function (t) {
  server.destroy()
  t.end()
})
