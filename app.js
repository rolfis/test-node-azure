'use strict';

import pkg from './package.json';

const express = require('express');
const helmet = require('helmet');
const port = process.env.PORT || 3000;

const NODE_MAJOR_VERSION = process.versions.node.split('.')[0];
const NODE_MINOR_VERSION = process.versions.node.split('.')[1];

// this express server should be secured/hardened for production use
const app = express();

// secure express server
app.use(helmet({
    frameguard: false
}));
app.disable('X-Powered-By');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

app.set('json spaces', 2);
app.enable('trust proxy');

// Development, in Azure it's set via XML config?
app.use("/assets", express.static(__dirname + '/public/assets'));

app.get('/', async (request, response) => {
    return response.send({
        success: true,
        version: pkg.version,
        node_major: NODE_MAJOR_VERSION,
        node_minor: NODE_MINOR_VERSION
    });
});

app.listen(port, () => log.info(`[Main] Application listening on port ${port}.`));

process.on('uncaughtException', (err) => {
    console.error('[Main] There was an uncaught error', err);
    process.exit(1); //mandatory (as per the Node docs)
});
