#!/usr/bin/env nodejs
// Import libraries
const bodyParser = require('body-parser'); // parse JSON requests
const compression = require('compression'); // compress file to GZIP
const cors = require('cors'); // CORS middleware
const csv = require('csvtojson'); // CSV parsing
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


// Five9 Statistics API request
app.post('/api/statistics', async (req, res) => {
    try {
        // Generate SOAP message for Five9
        const message = five9.jsonToSOAP(req.body, 'statistics');
        const auth = req.body['authorization'];

        // Send request to Five9
        let xmlData = await five9.sendRequest(message, auth, 'statistics');

        // On response, format as JSON and send back to client
        parseString(xmlData, (err, result) => {
            res.set('Content-Type', 'application/json');
            res.send(result);
        });
    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.send('An error occurred on the server during POST.');
    }
});

// Five9 Configuration API requests
app.post('/api/configuration', async (req, res) => {
    try {
        // Generate SOAP message for Five9
        const message = five9.jsonToSOAP(req.body, 'configuration');
        const auth = req.body['authorization'];

        // Send request to Five9
        let xmlData = await five9.sendRequest(message, auth, 'configuration');

        // On response, format as CSV and send back to client
        parseString(xmlData, (err, result) => {
            res.set('Content-Type', 'text/csv');
            res.send(result);
        });
    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.send('An error occurred on the server during POST.');
    }
});

// Request data to update maps page
app.get('/api/reports/maps', async (req, res) => {
    try {
        // Authenticate user
        //
        ////////////////////

        // Get data
        res.set('Content-Type', 'application/json');
        res.send(await getData());
    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.send(`An error occurred on the server when retrieving report information: ${err}`);
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


// Fire up the server
let currentlyUpdatingData = false;
let timeoutId = null;
const server = app.listen(port, async () => {
    console.log(`Express listening on port ${port}!`);
    mongoose.connect('mongodb://localhost/five9-report-data');

    // Begin updating from Five9 every 2.5 minutes
    async function scheduleUpdate(interval) {
        currentlyUpdatingData = true;
        // update from Five9
        await refreshDatabase();

        // Schedule next update
        currentlyUpdatingData = false;
        timeoutId = setTimeout(() => scheduleUpdate(interval), interval);
    }
    scheduleUpdate(0.25 * 60 * 1000);
});


async function getData() {
    const results = await report.Report.find({}, (err, data) => {
        return JSON.stringify(data);
    });
    return results;
}

// Update Five9 data
async function refreshDatabase() {
    log.record(`Updating report database at ${moment()}`);
    const time = {};
    time.start = moment().format('YYYY-MM-DD') + 'T00:00:00';
    time.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';

    const data = [];


    // Remove all old data
    await report.Report.remove({}, (err, success) => {
        console.log('delete err: ' + err);
        console.log('delete success: ' + success);
    });

    // Get CSV data
    const reportParameters = five9.getParameters('runReport', null,
                        criteriaTimeStart=time.start, criteriaTimeEnd=time.end);
    const csvData = await five9.getReportResults(reportParameters);
    const csvHeader = csvData.substr(0, csvData.indexOf('\n'));


    // Parse CSV data
    await new Promise((resolve, reject) => {
        csv( { delimiter: ',', headers: report.getHeadersFromCsv(csvHeader) } )
            .fromString(csvData)
            .on('json', (res) => {
                res.date = moment(res.date, 'YYYY/MM/DD').toDate();
                data.push(res);
                return resolve(data);
            }).on('error', reject);
        });

    // Insert the new data
    return report.Report.collection.insert(data, (err, docs) => {
        console.log('insert err: ' + err);
        return report.Report.collection.stats((err, results) => {
            console.log('stats err: ' + err);
            console.log('count: ' + results.count + '. size: ' + results.size + 'b');
        });
    });
}

module.exports = server;
