#!/usr/bin/env nodejs
const bodyParser = require('body-parser'); // parse JSON requests
const compression = require('compression'); // compress file to GZIP
const cors = require('cors');
const express = require('express');
const five9 = require('./five9-interface');
const fs = require('fs');
const helmet = require('helmet'); // security
const parseString = require('xml2js').parseString; // parse XML to JSON
const path = require('path');
const port = parseInt(process.env.PORT, 10) || 3000;


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
        const message = five9.jsonToSOAP(req.body);
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
        const message = five9.jsonToSOAP(req.body);
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

// queue page
app.get('/', async (req, res) => {
    let dir = './public/index.html';
    let str = fs.readFileSync(path, 'utf-8');
    res.send(str);
});

// maps page
app.get('/maps', async (req, res) => {
    let dir = path.join(__dirname + '/public/maps.html');
    res.sendFile(dir);
});


// Fire up the server
const server = app.listen(port, () => {
    console.log(`Express listening on port ${port}!`);
});

module.exports = server;
