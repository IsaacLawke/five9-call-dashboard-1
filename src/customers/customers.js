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

async function refreshData() {
    let auth = await getAuthToken(secure.LOOKER_CLIENT_ID, secure.LOOKER_CLIENT_SECRET);

    let data = await getJsonData(auth);
    console.log(data);
}


async function getAuthToken(client_id, client_secret) {
    let res = await lookerRequest(`client_id=${client_id}&client_secret=${client_secret}`,
                                 'login', '');
    return JSON.parse(res.body)['access_token'];
}

async function getJsonData(auth) {
    let endpoint = `looks/${secure.LOOKER_LOOK_ID}/run/json`;
    let params = 'limit=10';
    let data = await lookerRequest(params, endpoint, auth, 'GET');
    return data;
}

function lookerRequest(message, endpoint, auth, method='POST', contentType='application/x-www-form-urlencoded') {
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

        // abort on timeout of 300 seconds
        req.on('socket', (socket) => {
            socket.setTimeout(300000);
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



module.exports.refreshData = refreshData;
