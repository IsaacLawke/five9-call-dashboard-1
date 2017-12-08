/*
** This module pulls Looker data showing number of customers by zip code.
**
 */
const https = require('https');
const secure = require('../secure_settings'); // Looker paths
const log = require('../helpers/log'); // recording updates
const moment = require('moment-timezone'); // dates/times
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

//////////////////////////////////////////
// MongoDB database definitions
//////////////////////////////////////////
// Schema for report data
const customersSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    zipCode: String,
    count: Number
});

//  MongoDB model
const Customers = mongoose.model('Customers', customersSchema);

/**
 * Refresh the Customers table from Looker.
 * @return {Promise} Resolves once the Customers table is updated.
 */
async function refreshData() {
    let auth = await getAuthToken(secure.LOOKER_CLIENT_ID, secure.LOOKER_CLIENT_SECRET);

    let rawData = await getJsonData(auth);

    let data = format(rawData);

    // Remove old data and add the new
    await Customers.remove({});
    return Customers.collection.insert(data, (err, docs) => {
        if (err) log.error(`Error inserting data in Customers model: ${err}`);
    });
}

async function getData() {
    return await Customers.find({});
}

/**
 * @param  {Object} data JSON from Looker
 * @return {Object}      Data ready to be insterted into database
 */
function format(data) {
    return data
    // Remove null zip code
    .filter((d) => d[secure.LOOKER_FIELD_ZIP_CODE] != null)
    // Map to database's field names
    .map((d) => ({
            'zipCode': d[secure.LOOKER_FIELD_ZIP_CODE],
            'customerCount': d[secure.LOOKER_FIELD_CUSTOMER_COUNT]
        })
    );
}

/**
 * Gets the authorization token from Looker for further API requests.
 * @param  {String} client_id     API 3 client ID from Looker
 * @param  {String} client_secret API 3 client secret key from Looker
 * @return {String}               Access token for future API requests
 */
async function getAuthToken(client_id, client_secret) {
    let res = await lookerRequest(`client_id=${client_id}&client_secret=${client_secret}`,
                                 'login', '');
    return JSON.parse(res.body)['access_token'];
}

/**
 * Get JSON from the Look used by application.
 * Look ID is stored in the ../secure_settings.js file.
 * @param  {String} auth Auth token from Looker login
 * @return {object}      JSON object returned by Looker
 */
async function getJsonData(auth) {
    let endpoint = `looks/${secure.LOOKER_LOOK_ID}/run/json`;
    let params = 'limit=10';
    let data = await lookerRequest(params, endpoint, auth, 'GET');
    return JSON.parse(data.body);
}

/**
 * Makes a request to the Looker API.
 * @param  {String} message body of request
 * @param  {String} endpoint API URI endpoint (following base /api/ URL)
 * @param  {String} auth authentication token received from Looker
 * @param  {String} [method='POST']
 * @param  {String} [contentType='application/x-www-form-urlencoded']
 * @return {Promise} Resolves to object: { body: response body,
 *                   statusCode: response status code}
 */
function lookerRequest(message, endpoint, auth, method='POST',
                       contentType='application/x-www-form-urlencoded') {
    const path = secure.LOOKER_API_PATH + endpoint;

    // Options for HTTP requests
    const opt = {
        hostname: secure.LOOKER_API_HOSTNAME,
        path: path,
        port: 19999,
        method: method,
        headers: {
            'Authorization': 'token ' + auth,
            'Content-Type': contentType,
            'Content-Length': Buffer.byteLength(message)
        }
    };

    // Wrap in promise
    return new Promise((resolve, reject) => {
        // Create the HTTP request
        var req = https.request(opt, (res) => {
            // console.log('\n---------------------------------------');
            // console.log('---- Status:', res.statusCode, res.statusMessage);
            // console.log('---- Headers:', res.headers);

            var data = [];
            res.on('data', (d) => {
                data.push(d);
            });
            res.on('end', () => {
                var dataString = data.join('');
                resolve({ body: dataString, statusCode: res.statusCode });
            });
        });

        // Send the data
        req.write(message);

        // abort on timeout of 120 seconds
        req.on('socket', (socket) => {
            socket.setTimeout(120000);
            socket.on('timeout', () => {
                log.error(`----- Looker request timed out`);
                log.log(`----- Looker request timed out`);
                req.abort();
                reject(new Error('Looker request timed out.'));
            });
        });

        // Handle errors
        req.on('error', (e) => {
            log.error(e);
            reject(e);
        });
    });
}


module.exports.getData = getData;
module.exports.refreshData = refreshData;
