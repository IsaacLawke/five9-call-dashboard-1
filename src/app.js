#!/usr/bin/env nodejs
///////////////////////////
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
const secure = require('./secure_settings.js'); // local/secure settings

///////////////////////////
// Data management
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const report = require('./models/report'); // data feeds for SL & calls
const queue  = require('./models/queue-stats'); // real-time queue feeds

const users = require('./authentication/users'); // stores usernames to check auth
const verify = require('./authentication/verify'); // check user permissions

const customers = require ('./customers/customers');

///////////////////////////
// Define the app
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


///////////////////////////
// Page view routes
///////////////////////////

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

// scorecard
app.get('/scorecard', async (req, res) => {
    let dir = path.join(__dirname + '/public/scorecard.html');
    res.sendFile(dir);
});

// admin panel
app.get('/admin', async (req, res) => {
    let dir = path.join(__dirname + '/public/admin.html');
    res.sendFile(dir);
});


///////////////////////////
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
///////////////////////////

// Five9 current queue statistics (ACDStatus endpoint at Five9)
app.post('/api/queue-stats', async (req, res) => {
    try {
        // log.message(`API - Queue stats request from ${req.get('host')}`);

        // Authenticate user
        const hasPermission = await verify.hasPermission(req.body['authorization']);
        if (!hasPermission) {
            res.set('Content-Type', 'application/text');
            res.status(401).send('Could not authenticate your user.');
            return;
        }

        // Send data as response when loaded
        async function sendResponse() {
            let data;
            try {
                data = await queue.getData();
                res.set('Content-Type', 'application/json');
                res.send(JSON.stringify(data));
            } catch (err) {
                res.set('Content-Type', 'application/text');
                res.status(500).send(`An error occurred on the server while getting queue stats: ${err}`);
            }
        }
        queue.addUpdateListener(sendResponse);
    } catch (err) {
        log.error('Error during api/queue-stats: ' + JSON.stringify(err));
        res.set('Content-Type', 'application/text');
        res.send('An error occurred on the server during POST.');
    }
});

// Request data to update maps page
app.post('/api/reports/maps', async (req, res) => {
    handleReportRequest(req, res, report.getZipCodeData);
});

// Request data to update service level metrics
app.post('/api/reports/service-level', (req, res) => {
    handleReportRequest(req, res, report.getServiceLevelData);
});



/**
 * Handles all reporting data requests.
 * @param  {Express request} req
 * @param  {Express response} res
 * @param  {function} dataGetter is the function that retreives actual data from DB
 *                              (either getServiceLevelData or getZipCodeData)
  */
async function handleReportRequest(req, res, dataGetter) {
    try {
        // Authenticate user
        const hasPermission = await verify.hasPermission(req.body['authorization']);
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
        log.error(`Error during handleReportRequest(${dataGetter.name}): ` + JSON.stringify(err));
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
        const hasPermission = await verify.hasPermission(req.body['authorization']);
        if (!hasPermission) { // exit if no permission
            res.set('Content-Type', 'application/text');
            res.status(401).send('Could not authenticate your user.');
            return;
        } else { // continue if permission
            res.status(200).send('About to reboot! Closing Express server -- should be restarted by PM2 :)');
            pm2.restart('app', (err) => log.error(`pm2 restart error ${err}`));
        }
    } catch (err) {
        res.status(500).send('An error occurred on the server while attempting reboot.');
    }
});


///////////////////////////
// Fire up the server
///////////////////////////
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
            setTimeout(connect, 3000);
        });

        customers.refreshData();

        // Update queue stats every 15 seconds
        // Five9 stats API has a limit of 500 requests per hour
        //      (1 request every 7.2 seconds).
        // queue.scheduleUpdate(15 * 1000);
        // // Start updating call database every 2.5 minutes
        // report.scheduleUpdate(2.5 * 60 * 1000);
        // // Update user list every 12 hours
        // users.scheduleUpdate(12 * 60 * 60 * 1000);

    } catch (err) {
        log.error(`Error occurred on server:` + err);
    }
});


module.exports = server;
