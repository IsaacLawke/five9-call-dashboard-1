#!/usr/bin/env nodejs
// Import libraries
const bodyParser = require('body-parser'); // parse JSON requests
const compression = require('compression'); // compress file to GZIP
const cors = require('cors'); // CORS middleware
const express = require('express');
const five9 = require('./helpers/five9-interface'); // Five9 interface helper functions
const fs = require('fs');
const helmet = require('helmet'); // security
const log = require('./helpers/log'); // recording updates
const moment = require('moment'); // dates/times
const parseString = require('xml2js').parseString; // parse XML to JSON
const path = require('path');
const pm2 = require('pm2'); // for server restart when requested
const port = parseInt(process.env.PORT, 10) || 3000;
const secure = require('./secure_settings.js');

// Database handling
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const report = require('./models/report');

// Initialize the app
const app = express();

// GZIP it up
app.use(compression());
// Allow CORS
app.use(cors());
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
// Parse JSON requests
app.use(bodyParser.json());
// And throw in some security middleware for good measure...
app.use(helmet());


//////////////////////////////////////////////
// Page view routes
//////////////////////////////////////////////

// root index page
app.get('/', async (req, res) => {
    let dir = path.join(__dirname + '/public/index.html');
    res.sendFile(dir);
});

// queue page
app.get('/queues', async (req, res) => {
    let dir = path.join(__dirname + '/public/queues.html');
    res.sendFile(dir);
});

// maps page
app.get('/maps', async (req, res) => {
    let dir = path.join(__dirname + '/public/maps.html');
    res.sendFile(dir);
});

// admin panel
app.get('/admin', async (req, res) => {
    let dir = path.join(__dirname + '/public/admin.html');
    res.sendFile(dir);
});


///////////////////////////////////////////////////////////////////
// API routes to get data
// All routes need to include these parameters in the POST body:
//      - auth  : Base64 'username:password' Five9 credentials
//
// /statistics returns all real-time stats
//
// /reports routes take the following parameters in the POST body:
//      - start : start time for data range (YYYY-MM-DD[T]HH:mm:ss)
//      - end   : end time for data range (YYYY-MM-DD[T]HH:mm:ss)
//      - skills : in maps/zip code endpoint, which skill names to filter
//                 for, comma-separated. Matches "like" Five9 skill names.
///////////////////////////////////////////////////////////////////

// Five9 Statistics API request
app.post('/api/statistics', async (req, res) => {
    try {
        log.message(`API - Statistics request from ${req.connection.remoteAddress}`);

        // Generate SOAP message for Five9
        const message = five9.jsonToSOAP(req.body, 'statistics');
        const auth = req.body['authorization'];

        // Send request to Five9
        let response = await five9.sendRequest(message, auth, 'statistics');

        // On response, format as JSON and send back to client
        parseString(response.body, (err, result) => {
            res.set('Content-Type', 'application/json');
            res.send(result);
        });
    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.send('An error occurred on the server during POST.');
    }
});

// Request data to update maps page
app.post('/api/reports/maps', async (req, res) => {
    log.message(`API - Maps request from ${req.connection.remoteAddress}`);
    handleReportRequest(req, res, report.getZipCodeData);
});

// Request data to update service level metrics
app.post('/api/reports/service-level', (req, res) => {
    log.message(`API - Service Level request from ${req.connection.remoteAddress}`);
    handleReportRequest(req, res, report.getServiceLevelData);
});

// Handles all reporting data requests.
// ${dataGetter} is the function that retreives actual data from DB (either
// getServiceLevelData or getZipCodeData)
async function handleReportRequest(req, res, dataGetter) {
    try {
        // Authenticate user
        const hasPermission = await five9.canAuthenticate(req.body['authorization']);
        if (!hasPermission) {
            res.set('Content-Type', 'application/text');
            res.status(401).send('Could not authenticate your user.');
            return;
        }

        // Send data as response when loaded
        async function sendResponse() {
            let data;
            try {
                data = await dataGetter(req.body);
                res.set('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            } catch (err) {
                res.set('Content-Type', 'application/text');
                res.status(500).send(`An error occurred on the server while getting report data: ${err}`);
            }
        }
        report.addUpdateListener(sendResponse);

    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.status(500).send(`An error occurred on the server when retrieving report information: ${err}`);
    }
}

// Return ZIP3 JSON
app.get('/api/zip3-data', async (req, res) => {
    try {
        log.message(`API - ZIP3 data request from ${req.connection.remoteAddress}`);

        // return JSON zip data
        let dir = path.join(__dirname + '/public/zip3-albers.json');
        res.sendFile(dir);
    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.status(500).send('An error occurred on the server when getting zip3 data.');
    }
});

// Return U.S. states JSON
app.get('/api/states', async (req, res) => {
    try {
        log.message(`API - States geo data request from ${req.connection.remoteAddress}`);

        // return JSON zip data
        let dir = path.join(__dirname + '/public/states-albers.json');
        res.sendFile(dir);
    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.status(500).send('An error occurred on the server when getting U.S. states data.');
    }
});

// Notify server that a 502 has occurred
app.get('/api/notify-504', async (req, res) => {
    res.set('Content-Type', 'application/text');
    try {
        log.message(`--------LOGGER: 504 reported by client at ${moment()}`);
        log.error(`--------LOGGER: 504 reported by client at ${moment()}`);
        res.status(200).send('Thanks for the message!');
    } catch (err) {
        res.status(500).send('An error occurred on the server when getting U.S. states data.');
    }
});

// Reboot the server
app.post('/api/reboot-server', async (req, res) => {
    res.set('Content-Type', 'application/text');
    try {
        log.message(`--------LOGGER: reboot requested by client at ${moment()}.`);
        log.error(`--------LOGGER: reboot requested by client at ${moment()}.`);
        // Authenticate user. TODO: allow admin level only.
        const hasPermission = await five9.canAuthenticate(req.body['authorization']);
        if (!hasPermission) { // exit if no permission
            res.set('Content-Type', 'application/text');
            res.status(401).send('Could not authenticate your user.');
            return;
        } else { // continue if permission
            res.status(200).send('About to reboot! Closing Express server -- should be restarted by PM2 :)');
            // Close server -- will restart via PM2
            //server.close(() => {
            //    log.message(`Server closed.`);
            //    log.error(`Server closed at ${moment()}`);
            //});
            pm2.restart('app', (err) => log.error(`pm2 restart error ${err}`));
        }
    } catch (err) {
        res.status(500).send('An error occurred on the server while attempting reboot.');
    }
});


// Fire up the server
let timeoutId = null;

const server = app.listen(port, async () => {
    log.message(`Express listening on port ${port} at ${moment()}!`);

    try {
        // Connect and reconnect if disconnected.
        let connect = async () => {
            await mongoose.connect(secure.MONGODB_URI, {
    	           useMongoClient: true,
    	           keepAlive: 1000,
                   connectTimeoutMS: 10000,
                   reconnectTries: Number.MAX_VALUE
    	    });
        };
        connect();
        mongoose.connection.on('disconnected', () => {
            log.message('DB Disconnected: reconnecting.');
            log.error('DB Disconnected: reconnecting.');
            setTimeout(connect, 1000);
        });

        // Start updating database every 2.5 minutes
        timeoutId = report.scheduleUpdate(2.5 * 60 * 1000);

    } catch (err) {
        log.error(`Error occurred on server:`, err);
    }
});


module.exports = server;
