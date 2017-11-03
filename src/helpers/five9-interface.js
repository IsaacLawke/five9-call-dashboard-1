const secure_settings = require('../secure_settings.js');
const https = require('https');
const log = require('../helpers/log');
const parseString = require('xml2js').parseString; // parse XML to JSON
const xml = require('xml');


// See if user is authorized before pulling reports.
// Returns true if user has permissions; otherwise false.
// ${auth} should be base64 encoded 'username:password' string
async function canAuthenticate(auth) {
    // See if supervisor request •••returns 401 Not Authorized status
    const params = {
        'service': 'getMyPermissions'
    }
    const requestMessage = jsonToSOAP(params, 'statistics');
    let response = await sendRequest(requestMessage, auth, 'statistics');

    // If server responded with success, we're good
    if (response.statusCode == 200) {
        return true;
    }
    // If Five9 server was able to authenticate user but the user just doesn't
    // have a session open, they're good.
    if (response.statusCode == 500 && response.body.search('Session was closed') > -1) {
        return true;
    }
    // Otherwise, you shall not pass!
    return false;
}


// Takes a JSON object specifying a Five9 API endpoint,
// and returns a SOAP message to send to the Five9 API.
// requestType: statistics or configuration API
function jsonToSOAP(json, requestType) {
    let adminOrSupervisor;
    if (requestType == 'statistics') adminOrSupervisor = 'supervisor';
    else if (requestType == 'configuration') adminOrSupervisor = 'admin';
    else throw new Error(`requestType ${requestType} is not a valid type in jsonToSOAP!`);

    const service = json['service'];
    const settings = xml(json['settings']);
    const soapString =
        `<x:Envelope xmlns:x="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.${adminOrSupervisor}.ws.five9.com/">
            <x:Header/>
            <x:Body>
                <ser:${service}>
                    ${settings}
                </ser:${service}>
            </x:Body>
        </x:Envelope>`;
    return soapString;
}


// Create a request to the Five9 Statistics API.
// Returns promise.
function sendRequest(message, auth, requestType) {
    let path;
    if (requestType == 'statistics') {
        path = '/wssupervisor/v9_5/SupervisorWebService';
    } else if (requestType == 'configuration') {
        path = '/wsadmin/v9_5/AdminWebService';
    } else {
        throw new Error(`requestType ${requestType} is not a valid type in sendRequest!`);
    }

    // Options for HTTP requests
    const options = {
        hostname: 'api.five9.com',
        path: path,
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + auth,
            'Content-Type': 'text/xml;charset=UTF-8',
            'Content-Length': Buffer.byteLength(message),
            'SOAPAction': ''
        }
    };

    // Wrap in promise
    return new Promise((resolve, reject) => {
        // Create the HTTP request
        var req = https.request(options, (res) => {
            console.log('\n---------------------------------------');
            console.log('---- Status:', res.statusCode, res.statusMessage);
            console.log('---- Headers:', res.headers);

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

        req.on('error', (e) => {
            console.error(e);
            reject(e);
        });
    });
}


// Request - utility function for Five9 requests. Returns JSON object.
async function request(params, requestType) {
    const soap = jsonToSOAP(params, requestType);
    const response = await sendRequest(soap, params.authorization, requestType);
    let jsonResult;
    await parseString(response.body, (err, result) => {
        jsonResult = jsonToReturnValue(result, params.service);
    });

    let fault = getFaultStringFromData(jsonResult);
    if (fault != '') {
        const msg = `Request issue for ${requestType}: ${fault}`;
        log.error(msg);
        throw new Error(msg);
    }

    return jsonResult;
}

// Get CSV string of report results from Five9
async function getReportResults(params) {
    var reportResults;
    const id = await request(params, 'configuration');

    // Wait til the report is finished running
    let stillRunning = 'true';
    while (stillRunning == 'true') {
        stillRunning = await request(getParameters('isReportRunning', id),
                                     'configuration');
    }
    // Then retrieve the results
    let resultParams = getParameters('getReportResultCsv', id);
    let reportResult = await request(resultParams, 'configuration');

    return reportResult;
}


// Gets the actual returned value/data out of JSON from the server.
function jsonToReturnValue(json, type) {
    return json['env:Envelope']['env:Body'][0]['ns2:'+type+'Response'][0]['return'][0];
}


// takes JSON from server and returns text within 'faultstring' tag (if existant)
function getFaultStringFromData(data) {
    try {
        return data['env:Envelope']['env:Body'][0]['env:Fault'][0]['faultstring'];
    } catch (err) {
        return '';
    }
}

// Given a requestType, returns JSON to submit to server in POST request.
// requestType should match Five9 API command.
// Optional parameters used for some reporting commands.
function getParameters(requestType, reportId=null, criteriaTimeStart=null,
                       criteriaTimeEnd=null, reportName=null) {
    let params = {};
    // Initiate session
    if (requestType == 'setSessionParameters') {
        params = {
            'service': 'setSessionParameters',
            'settings': [ {
                'viewSettings': [
                    { 'idleTimeOut': 1800 },
                    { 'statisticsRange': 'CurrentDay' },
                    { 'rollingPeriod': 'Minutes10' }
                ] }
            ]
        }
    }
    // Report running params
    if (requestType == 'runReport') {
        params = {
            'service': 'runReport',
            'settings': [
                { 'folderName': 'Contact Center Reports' },
                { 'reportName': reportName },
                { 'criteria': [ {
                    'time': [
                        { 'end': criteriaTimeEnd },
                        { 'start': criteriaTimeStart }
                    ]
                } ] }
            ]
        }
    }
    if (requestType == 'isReportRunning') {
        params = {
            'service': 'isReportRunning',
            'settings': [
                { 'identifier': reportId },
                { 'timeout': '5' }
            ]
        }
    }
    if (requestType == 'getReportResultCsv') {
        params = {
            'service': 'getReportResultCsv',
            'settings': [
                { 'identifier': reportId }
            ]
        }
    }
    // Credentials
    let user = secure_settings.FIVE9_USERNAME;
    let pass = secure_settings.FIVE9_PASSWORD;
    let auth = user + ':' + pass;
    params['authorization'] = Buffer.from(auth).toString('base64'); // Base 64 encoding. Yum!

    return params;
}



module.exports.canAuthenticate = canAuthenticate;
module.exports.jsonToSOAP = jsonToSOAP;
module.exports.sendRequest = sendRequest;
module.exports.getParameters = getParameters;
module.exports.getReportResults = getReportResults;
