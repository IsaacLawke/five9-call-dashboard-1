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


//////////////////////////////////////////////
// API routes to get data
//////////////////////////////////////////////

// Five9 Statistics API request
app.post('/api/statistics', async (req, res) => {
    try {
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

// Five9 Configuration API requests
// TODO: add authentication step
// app.post('/api/configuration', async (req, res) => {
//     try {
//         // Generate SOAP message for Five9
//         const message = five9.jsonToSOAP(req.body, 'configuration');
//         const auth = req.body['authorization'];
//
//         // Send request to Five9
//         let response = await five9.sendRequest(message, auth, 'configuration');
//
//         // On response, format as CSV and send back to client
//         parseString(response.body, (err, result) => {
//             res.set('Content-Type', 'text/csv');
//             res.send(result);
//         });
//     } catch (err) {
//         res.set('Content-Type', 'application/text');
//         res.send('An error occurred on the server during POST.');
//     }
// });

// Request data to update maps page
// Takes parameters to pass in for start time and end time
app.post('/api/reports/maps', async (req, res) => {
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
            console.log('sendResponse called!');
            let data;
            try {
                data = await report.getData(req.body);
            } catch (err) {
                res.set('Content-Type', 'application/text');
                res.status(500).send(`An error occurred on the server while getting report data: ${err}`);
            }
            res.set('Content-Type', 'application/json');
            res.send(data);
        }
        report.addUpdateListener(sendResponse);

    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.status(500).send(`An error occurred on the server when retrieving report information: ${err}`);
    }
});

// Return ZIP3 JSON
app.get('/api/zip3-data', async (req, res) => {
    try {
        // return JSON zip data
        let dir = path.join(__dirname + '/public/zip3-albers.json');
        res.sendFile(dir);
    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.send('An error occurred on the server when getting zip3 data.');
    }
});

// Return U.S. states JSON
app.get('/api/states', async (req, res) => {
    try {
        // return JSON zip data
        let dir = path.join(__dirname + '/public/states-albers.json');
        res.sendFile(dir);
    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.send('An error occurred on the server when getting U.S. states data.');
    }
});


// Fire up the server
let timeoutId = null;

const server = app.listen(port, async () => {
    log.message(`Express listening on port ${port}!`);

    // Connect and begin updating every 2.5 minutes
    try {
        await mongoose.connect('mongodb://localhost/five9-report-data', {
	    useMongoClient: true,
	    keepAlive: true
	});
        timeoutId = report.scheduleUpdate(2.5 * 60 * 1000);
    } catch (err) {
        log.message(`Error occurred on server: ${err}`);
    }
});


module.exports = server;
