const compression = require('compression');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const parseString = require('xml2js').parseString;
const five9 = require('./../five9-interface');


const app = express();

// GZIP it up
app.use(compression());
// Allow CORS
app.use(cors());
// Parse JSON requests
app.use(bodyParser.json());


// Listen for POST to pass along to Five9 API
app.post('/', async (req, res) => {
    // Generate SOAP message for Five9
    const message = five9.jsonToSOAP(req.body);
    const auth = req.body['authorization'];

    // Send request to Five9
    let xmlData = await five9.statsRequest(message, auth);

    // On response, format as JSON and send back to client
    parseString(xmlData, (err, result) => {
        res.set('Content-Type', 'application/json');
        res.send(result);
    });
});

// Listen for post to initialize session.
// POST body should include credentials in 'username:password' form.
app.post('/initialize', async (req, res) => {
    const credentials = req.body;

});

app.get('*', async (req, res) => {
    res.send('Unkown route! Contact technical support.', 404);
});


const server = app.listen(3000, () => {
    console.log('Express listenting on port 3000!')
});

module.exports = server;
