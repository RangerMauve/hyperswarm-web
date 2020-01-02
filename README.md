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

# Run it! Default port is 4977 (HYPR on a phone pad)
hyperswarm-web

# Run it with a custom port
hyperswarm-web --port 42069
```

### Running as a Linux service with SystemD

```bash
sudo cat << EOF > /etc/systemd/system/hyperswarm-web.service
[Unit]
Description=Hyperswarm proxy server which webpages can connect to.

[Service]
Type=simple
# Check that hyperswarm-web is present at this location
# If it's not, replace the path with its location
# You can get the location with 'whereis hyperswarm-web'
# Optionally add a --port parameter if you don't want 4977
ExecStart=/usr/local/bin/hyperswarm-web
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo chmod 644 /etc/systemd/system/hyperswarm-web.service

sudo systemctl daemon-reload
sudo systemctl enable hyperswarm-web
sudo systemctl start hyperswarm-web

sudo systemctl status hyperswarm-web
```
