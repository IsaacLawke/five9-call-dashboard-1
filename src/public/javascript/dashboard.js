// timeout to pause event loop when needed
let timeout = null;

let gizmo = null;

$(document).ready(() => {
    let callMap;

    // show Login form
    $('.credentials-cover-toggle').click(() => {
        $('.credentials-form').removeClass('out-of-the-way');
        $('.credentials-cover').addClass('out-of-the-way');
    });

    // listen for sign-in button press
    $('.begin-session').click(async (event) => {
        // prevent redirection
        event.preventDefault();
        // stop any current event loops running
        if (timeout != null) {
            clearTimeout(timeout);
        }

        // clear Five9 credentials box and update Login button text
        $('.credentials-form').addClass('out-of-the-way');
        $('.credentials-cover').removeClass('out-of-the-way');
        $('.credentials-cover-toggle').text('Logged In');

        await beginSession();
        await updateMap(callMap);
        console.log('finished updateMap()!');
    });


    d3.csv('http://localhost:3000/api/data', (data) => {
        data.forEach((d) => {
            d.CALLS = +d.CALLS;
        });

        callMap = new CallMap();
        callMap.create(data);
    });
});

async function updateMap(callMap) {
    let startTime = $('.filter.start-time').val();
    let endTime = $('.filter.end-time').val();
    let params = getParameters('runReport', null, startTime, endTime);
    let runReport = await request(params, 'configuration');

    let reportId = jsonToReturnValue(await runReport.json(), 'runReport');

    async function awaitReport(id) {
        let runResponse = await request(getParameters('isReportRunning', id),
                                        'configuration');
        let stillRunning = jsonToReturnValue(await runResponse.json(), 'isReportRunning');

        if (stillRunning == 'true') {
            console.log('Awaiting report result...');
            setTimeout(() => awaitReport(id), 5000);
        } else {
            let params = getParameters('getReportResultCsv', id);
            let reportResult = await request(params, 'configuration');

            let res = await reportResult.json();
            let reportCsv = jsonToReturnValue(res, 'getReportResultCsv');
            console.log(res);

            const data = d3.csvParse(reportCsv);
            data.forEach((d) => {
                d.CALLS = +d.CALLS;
            });

            callMap.update(data);
        }
    }
    awaitReport(reportId);
}

// Let's get started!
// Authorize user to start pulling data.
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


async function run() {
    async function eventLoop(interval) {
        // Get the data
        let params = getParameters('ACDStatus');
        let response = await request(params);
        let data;

        try {
            data = await response.json();
            data = data['soap:Envelope']['soap:Body'][0]
                       ['ns2:getStatisticsResponse'][0]['return'][0];
            // Parse the data and pass it to the view updater
            refreshView(jsonToViewData(data));
        } catch (err) {
            // try to get <message> tag, if it exists
            let msg = getFaultStringFromData(data);
            error(err, `Server responded unexpectedly, with message: ${msg}. You authorized?`);
        }

        // restart loop
        timeout = setTimeout(() => {
            eventLoop(interval);
        }, interval);
    }

    // Refresh every 20 seconds.
    // Five9 stats API has a limit of 500 requests per hour
    //      (1 request every 7.2 seconds).
    eventLoop(20000);
}


// Send out an error alert in console and on the page.
function error(err, message='Uh oh.') {
    $('#message').text(`Whoops! An error occurred. ${err.message}. ${message}`);
    console.log('Error log:');
    console.error(err);

    // timestamp
    var newDate = new Date();
    newDate.setTime(Date.now());
    dateString = newDate.toTimeString();
    console.log(dateString);
}


// Takes nicely formatted data. Updates dashboard view.
function refreshView(data) {
    // update each gizmo on the screen
    $('.gizmo').each((i, gizmoElement) => {
        let name = gizmo.gizmos[gizmoElement.id].name;
        let skills = gizmo.gizmos[gizmoElement.id].skillFilter;

        // Determine calls and agent stats for this gizmo's skills
        let callsInQueue = 0,
            maxWait = 0,
            agentsLoggedIn = 0,
            agentsNotReady = 0,
            agentsOnCall = 0,
            agentsReady = 0;

        for (let i=0; i < data.length; i++) {
            let queue = data[i];
            // Include skills in gizmo filter, or all skills if none are in filter
            if (skills.includes(queue['Skill Name']) || skills.length == 0) {
                callsInQueue += queue['Calls In Queue']*1;
                if (queue['Calls In Queue']*1 > 0) console.log(queue);
                maxWait = Math.max(maxWait, queue['Current Longest Queue Time']*1);
                agentsLoggedIn = Math.max(agentsLoggedIn, queue['Agents Logged In'].split(' ')[0]*1);
                agentsNotReady = Math.max(agentsNotReady, queue['Agents Not Ready For Calls']*1);
                agentsOnCall = Math.max(agentsOnCall, queue['Agents On Call']*1);
                agentsReady = Math.max(agentsReady, queue['Agents Ready For Calls']*1);
            }
        }
        // Format wait time from seconds to MM:SS or HH:MM:SS
        let waitString;
        const wait = new Date(null);
        wait.setSeconds(maxWait);
        if (maxWait < 3600) {
            waitString = wait.toISOString().substr(14, 5);
        } else {
            waitString = wait.toISOString().substr(11, 8);
        }

        // Update view
        $(gizmoElement).find('.metric.calls-in-queue').text(callsInQueue);
        $(gizmoElement).find('.metric.max-wait').text(waitString);
        $(gizmoElement).find('.agents-logged-in').text(agentsLoggedIn);
        $(gizmoElement).find('.agents-not-ready-for-calls').text(agentsNotReady);
        $(gizmoElement).find('.agents-on-call').text(agentsOnCall);
        $(gizmoElement).find('.agents-ready-for-calls').text(agentsReady);
    });

    // Clear old messages
    $('#message').text(' ');

    // Update clock
    $('.clock').text(formatAMPM(new Date()));
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


// Given a requestType, returns JSON to submit to server in POST request.
// requestType should match Five9 API command.
// Optional parameters used for some reporting commands.
function getParameters(requestType, reportId=null, criteriaTimeStart=null,
                       criteriaTimeEnd=null) {
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

    // Report running params
    if (requestType == 'runReport') {
        params = {
            'service': 'runReport',
            'settings': [
                { 'folderName': 'Contact Center Reports' },
                { 'reportName': 'Calls by Zip' },
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
    let user = $('.credentials.username').val();
    let pass = $('.credentials.password').val();
    let auth = user + ':' + pass;
    params['authorization'] = btoa(auth); // Base 64 encoding. Yum!

    return params;
}

// Breaks down " skill1, skill2 , skill3" string
//          to ['skill1','skill2','skill3'] array
function skillStringToArray(skillString) {
    if (skillString == '') return [];
    return skillString.split(',').map((skill) => skill.trim());
}

// Return formatted column / key assignments
// Takes JSON generated from original Five9 SOAP API response
function jsonToViewData(json,
        includeFields=['Skill Name', 'Calls In Queue',
                        'Current Longest Queue Time', 'Agents Logged In',
                        'Agents Not Ready For Calls', 'Agents On Call',
                        'Agents Ready For Calls']) {
    let columns = json['columns'][0]['values'][0]['data'];
    let rows = json['rows'];
    let data = [];

    for (let i=0; i < rows.length; i++) {
        let row = rows[i]['values'][0]['data'];
        let newRow = {};
        for (let j=0; j < includeFields.length; j++) {
            let field = includeFields[j];
            newRow[field] = row[columns.indexOf(field)];
            // trim extra 0's to fix time formatting (to seconds)
            if (field == 'Current Longest Queue Time')
                newRow[field] = newRow[field].slice(0, -3);
        }
        data.push(newRow);
    }
    return data;
}

function jsonToReturnValue(json, type) {
    return json['env:Envelope']['env:Body'][0]['ns2:'+type+'Response'][0]['return'][0];
}


function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    seconds = seconds < 10 ? '0'+seconds : seconds;
    var strTime = hours + ':' + minutes + ':' + seconds + ' ' + ampm;
    return strTime;
}

// takes JSON from server and returns text within 'faultstring' tag (if existant)
function getFaultStringFromData(data) {
    try {
        return data['soap:Envelope']['soap:Body'][0]['soap:Fault'][0]['faultstring'];
    } catch (err) {
        return '';
    }
}
