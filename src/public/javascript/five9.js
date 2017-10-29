////////////////////////////////////////////////////////////////
// Functions to retrieve and extract useful data from Five9.
// These functions interact with our server, which then passes
// requests on to Five9's server.
////////////////////////////////////////////////////////////////

// Get CSV string of report results from Five9
async function getReportResults(params) {
    const auth = getAuthString($('.username').val(), $('.password').val());
    params['authorization'] = auth;

    const response = await getReportData(params);
    const data = await response.json();
    return data;
}


// Let's get started!
// Authorize user to start pulling data in a Statistics session.
// Returns true if successful, and false otherwise.
async function beginSession() {
    // Initiate session with Five9 statistics API
    let params = getParameters('setSessionParameters');
    let response = await request(params);

    if (response.status == 200) {
        console.log('Session has begun!');
        let data = await response.json();
        let fault = getFaultStringFromData(data);
        if (fault != '') throw new Error('Set Session Parameters issue: ' + fault);
    } else {
        console.log(response);
        throw new Error('Set sessions parameters HTTP status code: ' + response.statusCode);
    }
}

async function getReportData(parameters) {
    const apiURL = API_URL + 'reports/maps'; // defined in api_url.js

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
        .then((response) => {
            if (!response.ok) error(response.status);
            return response;
        }).then((response) => {
            return response;
        }).catch((err) => {
            error(err);
        });
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


 // Combines username and password, then encodes in Base 64. Yum!
function getAuthString(username, password) {
    let auth = username + ':' + password;
    return btoa(auth);
}
