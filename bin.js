const HyperswarmServer = require('hyperswarm-proxy-ws/server')
const argv = require('minimist')(process.argv.slice(2))

const DEFAULT_PORT = 4977 // HYPR on a cellphone keypad

const server = new HyperswarmServer()

const port = argv.port ? parseInt(argv.port, 10) : DEFAULT_PORT

server.listen(port, () => {
  console.log('Listening to server')
})
