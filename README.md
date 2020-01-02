# hyperswarm-web
Implementation of the hyperswarm API for use in web browsers


## Using in an application

```
npm i -s hyperswarm-web
```

```js
// Based on example in hyperswarm repo
// Try running the regular hyperswarm demo with node
const hyperswarm = require('hyperswarm-web')
const crypto = require('crypto')

const swarm = hyperswarm({
  // If you omit this, it'll try to connect to 'ws://localhost:4977'
  wsProxy: 'ws://yourproxy.com'
})

// look for peers listed under this topic
const topic = crypto.createHash('sha256')
  .update('my-hyperswarm-topic')
  .digest()

swarm.join(topic)

swarm.on('connection', (socket, details) => {
  console.log('new connection!', details)

  // you can now use the socket as a stream, eg:
  // socket.pipe(hypercore.replicate()).pipe(socket)
})
```

Build it with [Browserify](http://browserify.org/) to get it running on the web.

You could also compile an existing codebase relying on hyperswarm to run on the web by adding a `browser` field set to `{"hyperswarm": "hyperswarm-web"}` to have Browserify alias it when compiling dependencies.

## Setting up a proxy server

```
npm i -g hyperswarm-web

# Run it! Default port is 4977
hyperswarm-web

# Run it with a custom port
hyperswarm-web --port 42069
```
