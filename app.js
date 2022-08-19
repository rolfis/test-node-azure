'use strict';

const pkg = require('./package.json');
const express = require('express');
const session = require('express-session');
const fileStore = require('session-file-store')(session);
const helmet = require('helmet');
const bodyParser = require('body-parser');
const logger = require('pino')();
const dotenv = require('dotenv').config();
const passport = require('passport-canvas');
const { req } = require('pino-std-serializers');

const port = process.env.PORT || 3000;
const NODE_MAJOR_VERSION = process.versions.node.split('.')[0];
const NODE_MINOR_VERSION = process.versions.node.split('.')[1];

logger.level = "debug";

const cookieMaxAge = 3600000 * 12; // 12h

const fileStoreOptions = { ttl: 3600 * 12, retries: 3 };

const sessionOptions = { 
    store: new fileStore(fileStoreOptions),
    secret: "keyboard cat dog mouse",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { maxAge: cookieMaxAge }
};

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

// need different session cookie options for production
if (process.env.NODE_ENV === "production") {
    app.set('trust proxy', 1);
    sessionOptions.cookie.secure = "true";
    sessionOptions.sameSite = 'none'; 
}

// Development, in Azure it's set via XML config?
app.use("/assets", express.static(__dirname + '/public/assets'));

logger.debug(sessionOptions);
app.use(session(sessionOptions));

app.get('/', async (request, response) => {
    logger.info("Got request.");
    logger.debug("Session id: " + request.session.id);

    if (request.session.views) {
        logger.debug("Views: " + request.session.views);
        request.session.views++;
    }
    else {
        logger.debug("No views, setting to 1.");
        request.session.views = 1;
    }

    return response.send({
        success: true,
        session: request.session.id,
        views: request.session.views,
        version: pkg.version,
        node_env: process.env.NODE_ENV,
        node_major: NODE_MAJOR_VERSION,
        node_minor: NODE_MINOR_VERSION,
    });
});

app.listen(port, () => logger.info(`Application listening on port ${port}.`));

process.on('uncaughtException', (err) => {
    logger.error('There was an uncaught error: ' + err, err);
    process.exit(1); //mandatory (as per the Node docs)
});
