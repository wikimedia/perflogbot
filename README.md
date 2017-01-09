perflogbot
----------

## Configuration

perflogbot uses [node-config](https://github.com/lorenwest/node-config).
The default configuration file (also in source control)
is [config/default.json](./config/default.json). See [Config load order] for
a complete list of valid file names and when they are used. In a nutshell,
use `local.json` for local development, and `production.json` for deployment.
This is automatically switched when `export NODE_ENV=production` is set.

## Quick start

After cloning from Git:

<pre lang="sh">
npm install
npm start
</pre>
