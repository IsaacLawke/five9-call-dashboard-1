////////////////////////////////////////////////////////////////
// Functions to retrieve and extract useful data from Five9.
// These functions interact with our server, which then passes
// requests on to Five9's server.
////////////////////////////////////////////////////////////////

// Get real-time stats
async function queueStats() {
    const auth = getAuthString($('.username').val(), $('.password').val());
    const params = { authorization: auth };

    const response = await request(params, 'queue-stats');
    return await response.json();
}


// Get CSV string of report results from Five9
// ${type}: 'maps' or 'service-level'
async function getReportResults(params, type) {
    const auth = getAuthString($('.username').val(), $('.password').val());
    params['authorization'] = auth;

    const response = await getReportData(params, type);
    const data = await response.json();
    return data;
}


// ${reportType} : either 'maps' or 'service-level'
async function getReportData(parameters, reportType) {
    const apiURL = API_URL + 'reports/' + reportType; // defined in api_url.js

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
    };
    return fetch(apiURL, requestOptions)
        .then(async (response) => {
            if (!response.ok) {
                let bodyText = await response.text();
                throw new Error(`Server responded with ${response.status} ${response.statusText}: ${bodyText}`);
            }
            return response;
        });
}


// Make a request to server with given parameters (from getParameters)
async function request(parameters, url='statistics') {
    const apiURL = API_URL + url; // defined in api_url.js

    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(parameters)
    }

    return fetch(apiURL, requestOptions)
        .then(async (response) => {
            if (response.status == 504) notifyServer504(parameters, url); // debugging
            if (!response.ok) {
                let bodyText = await response.text();
                throw new Error(`Server responded with ${response.status} ${response.statusText}: ${bodyText}`);
            }
            return response;
        }).then((response) => {
            return response;
        }).catch((err) => {
            error(err);
        });
}

async function notifyServer504() {
    return fetch(API_URL + 'notify-504');
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
function getParameters(requestType) {
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
    // Get real-time call stats
    if (requestType == 'ACDStatus') {
        params = {
            'service': 'getStatistics',
            'settings': [ {
                'statisticType': 'ACDStatus'
            } ]
        }
    }

    // Credentials
    let user = $('.username').val();
    let pass = $('.password').val();
    params['authorization'] = getAuthString(user, pass);

    return params;
}
