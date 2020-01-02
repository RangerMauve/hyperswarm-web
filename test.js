const hyperswarm = require('hyperswarm')
const HyperswarmServer = require('hyperswarm-proxy-ws/server')
const hyperswarmweb = require('./')
const test = require('tape')
const getPort = require('get-port')
const crypto = require('crypto')

test('Connect to local hyperswarm through local proxy', async (t) => {
  t.plan(6)
  try {
    // Initialize local hyperswarm instance, listen for peers
    const swarm = hyperswarm()

    // Initialize local proxy
    const server = new HyperswarmServer()
    const port = await getPort()

    server.listen(port)

    // Initialize client
    const hostname = `ws://localhost:${port}/`
    const client = hyperswarmweb({
      wsProxy: hostname
    })

    // Test connections in regular hyperswarm
    swarm.once('connection', (connection, info) => {
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

    // Test connections in proxied hyperswarm
    client.once('connection', (connection) => {
      connection.on('error', () => {
        // Whatever
      })

      t.pass('Got proxied connection')
      connection.once('data', () => {
        t.pass('Proxied connection got data')
        connection.end(() => {
          t.pass('Proxied connection closed')
          client.destroy()
          server.destroy()
        })
      })

      connection.write('Hello World')

      client.on('connection', (connection2) => {
        // Ignore other connections
        connection2.on('error', () => {
          // Whatever
        })
      })
    })

    const key = crypto.randomBytes(32)

    // Join channel on local hyperswarm
    swarm.join(key, {
      announce: true,
      lookup: true
    })

    // Join channel on client
    client.join(key)
  } catch (e) {
    console.error(e)
    t.fail(e)
  }
})
