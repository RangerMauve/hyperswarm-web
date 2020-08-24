#!/usr/bin/env node

const HyperswarmServer = require('./server')

const http = require('http')
const send = require('send')
const path = require('path')

const argv = require('minimist')(process.argv.slice(2))

const DEFAULT_PORT = 4977 // HYPR on a cellphone keypad

const INDEX_HTML_LOCATION = path.join(__dirname, 'index.html')

const server = http.createServer(function onRequest (req, res) {
  send(req, INDEX_HTML_LOCATION)
    .pipe(res)
})

const wsServer = new HyperswarmServer()

wsServer.listenOnServer(server)

const port = argv.port ? parseInt(argv.port, 10) : DEFAULT_PORT

console.log(`Listening on ws://localhost:${port}`)
console.log(`-> Proxy available on ws://localhost:${port}/proxy`)
console.log(`-> Signal available on ws://localhost:${port}/signal`)

server.listen(port)
