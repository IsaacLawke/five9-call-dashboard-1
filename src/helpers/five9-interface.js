const secure_settings = require('../secure_settings.js');
const https = require('https');
const log = require('../helpers/log');
const parseString = require('xml2js').parseString; // parse XML to JSON
const xml = require('xml');




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
            //console.log('\n---------------------------------------');
            //console.log('---- Status:', res.statusCode, res.statusMessage);
            //console.log('---- Headers:', res.headers);

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
                log.error(`----- Five9 request timed out`);
                log.log(`----- Five9 request timed out`);
                req.abort();
                reject(new Error('Five9 request timed out.'));
            });
        });

        // Handle errors
        req.on('error', (e) => {
            log.error(e);
            reject(e);
        });
    });
}


// Request - utility function for Five9 requests. Returns JSON object.
async function request(params, requestType, multipleReturns) {
    const soap = jsonToSOAP(params, requestType);
    const response = await sendRequest(soap, params.authorization, requestType);
    let jsonResult;
    await parseString(response.body, (err, result) => {
        jsonResult = jsonToReturnValue(result, params.service, multipleReturns);
    });

    let fault = getFaultStringFromData(jsonResult);
    if (fault != '') {
        const msg = `Request issue for ${requestType}: ${fault}`;
        log.error(msg);
        throw new Error(msg);
    }

    return jsonResult;
}

// Opens a statistics API session, if not already open
async function openStatisticsSession() {
    // first, use getSessionParameters to see if a session is already open
    let params = getParameters('getSessionParameters');
    let soap = jsonToSOAP(params, 'statistics');
    let response = await sendRequest(soap, params.authorization, 'statistics');
    if (response.statusCode == 200) {
        return response;
    }

    // No session open -- open with setSessionParameters
    params = getParameters('setSessionParameters');
    soap = jsonToSOAP(params, 'statistics');
    response = await sendRequest(soap, params.authorization, 'statistics');
    if (response.statusCode == 200) {
        log.message('Opening new statistics session - 200 response');
        let fault = getFaultStringFromData(response.body);
        if (fault != '') throw new Error('Set Session Parameters issue: ' + fault);
        return response;
    }

    log.error('setSessionParameters status != 200, response:' + JSON.stringify(response));
    throw new Error('Set sessions parameters HTTP status code: ' + response.statusCode);
    return response;
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

// Access the Five9 `getUsersGeneralInfo` endpoint, returning the return value
// from there as JSON.
async function getUsersGeneralInfo() {
    let params = getParameters('getUsersGeneralInfo');
    let result = await request(params, 'configuration', true);
    return result;
}

// Gets the actual returned value/data out of JSON from the server.
// @param returnMultiple - include multiple data points from the SOAP `return`
//                         value. true for getUsersGeneralInfo.
function jsonToReturnValue(json, type, returnMultiple=false) {
    if (returnMultiple) {
        return json['env:Envelope']['env:Body'][0]['ns2:'+type+'Response'][0]
                   ['return'];
   } else {
       return json['env:Envelope']['env:Body'][0]['ns2:'+type+'Response'][0]
                  ['return'][0];
   }
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
// Builds in authorization, so this should only be used after authenticating
//    the client as needed.
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
    // Check if session is open
    if (requestType == 'getSessionParameters') {
        params = {
            'service': 'getSessionParameters'
        }
    }
    // Get real-time call stats
    if (requestType == 'ACDStatus') {
        params = {
            'service': 'getStatistics',
            'settings': [ {
                'statisticType': 'ACDStatus'
            } ]
        }
    }
    // Get user list w/ basic info
    if (requestType == 'getUsersGeneralInfo') {
        params = {
            'service': 'getUsersGeneralInfo',
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


// Takes a JSON object specifying a Five9 API endpoint,
// and returns a SOAP message to send to the Five9 API.
// requestType: statistics or configuration API
function jsonToSOAP(json, requestType) {
    let adminOrSupervisor;
    if (requestType == 'statistics') adminOrSupervisor = 'supervisor';
    else if (requestType == 'configuration') adminOrSupervisor = 'admin';
    else throw new Error(`requestType ${requestType} is not a valid type in jsonToSOAP!`);

    const service = json['service'];
    const settings = json['settings'] ? xml(json['settings']) : '';
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


module.exports.jsonToSOAP = jsonToSOAP;
module.exports.request = request;
module.exports.sendRequest = sendRequest;
module.exports.getParameters = getParameters;
module.exports.getReportResults = getReportResults;
module.exports.getUsersGeneralInfo = getUsersGeneralInfo;
module.exports.openStatisticsSession = openStatisticsSession;
