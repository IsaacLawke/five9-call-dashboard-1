////////////////////////////////////////////////////////////////
// Functions to retrieve and extract useful data from Five9.
// These functions interact with our server, which then passes
// requests on to Five9's server.
////////////////////////////////////////////////////////////////

// Get CSV string of report results from Five9
async function getReportResults(params) {
    const response = await getReportData();
    const data = await response.json();
    console.log(data[0]);
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

async function getReportData() {
    const apiURL = API_URL + 'reports/maps'; // defined in api_url.js

    const requestOptions = {
        method: 'GET',
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
