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


// Listen for POST to pass along to Five9 API
app.post('/api', async (req, res) => {
    try {
        // Generate SOAP message for Five9
        const message = five9.jsonToSOAP(req.body);
        const auth = req.body['authorization'];

        // Send request to Five9
        let xmlData = await five9.statsRequest(message, auth);

        // On response, format as JSON and send back to client
        parseString(xmlData, (err, result) => {
            console.log(xmlData);
            res.set('Content-Type', 'application/json');
            res.send(result);
        });
    } catch (err) {
        res.set('Content-Type', 'application/text');
        res.send('An error occurred on the server during POST.');
    }
});


app.get('/', async (req, res) => {
    let path = './public/index.html';
    console.log(path);
    let str = fs.readFileSync(path, 'utf-8');
    res.send(str);
});


const server = app.listen(port, () => {
    console.log(`Express listenting on port ${port}!`);
});

module.exports = server;
