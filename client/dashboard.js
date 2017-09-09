
// timeout to pause event loop when needed
let timeout = null;

$(document).ready(() => {
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

        // clear Five9 credentials box
        $('.credentials-form').addClass('out-of-the-way');
        $('.credentials-cover').removeClass('out-of-the-way');

        const success = await beginSession();

        try {
            run();
        } catch (err) {
            error(err, 'Full authenticated?');
        }
    });
});


// Let's get started!
// Authorize user to start pulling data.
// Returns true if successful, and false otherwise.
async function beginSession() {

    // Initiate session with Five9 statistics API
    let params = getParameters('setSessionParameters');
    let response = await request(params);
    if (response.status == 200) {
        console.log('Session has begun!');
        return true;
    } else {
        console.log(response);
        error(new Error('HTTP status code: ' + response.statusCode));
    }
}


async function run() {
    async function eventLoop(interval) {
        // Get the data
        params = getParameters('ACDStatus');
        response = await request(params);
        let data = await response.json();
        data = data['soap:Envelope']['soap:Body'][0]
                   ['ns2:getStatisticsResponse'][0]['return'][0];

        // Parse the data and pass it to the view updater
        refreshView(formatJSON(data));

        // restart loop
        timeout = setTimeout(() => {
            eventLoop(interval);
        }, interval);
    }

    try {
        eventLoop(3000);
    } catch (err) {
        error(err, 'Error while running event loop.');
    }
}


function error(err, message) {
    $('#message').text(`Whoops! An error occurred when fetching data:   ${err.message}. ${message}`);
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
    $('.gizmo').each((i, gizmo) => {
        let skillFilter, name;
        try {
            skillFilter = gizmos[gizmo.id].skillFilter;
            name = gizmos[gizmo.id].name;
        } catch (e) {
            skillFilter = [];
            name = 'Gizmo Widget';
        }

        // Determine calls in queue & max wait
        let callsInQueue = 0;
        let maxWait = 0;
        for (let i=0; i < data.length; i++) {
            let queue = data[i];
            if (skillFilter.includes(queue['Skill Name']) || skillFilter.length == 0) {
                callsInQueue += queue['Calls In Queue'] * 1;
                maxWait = Math.max(maxWait, queue['Current Longest Queue Time'] * 1);
                if (queue['Current Longest Queue Time'] * 1 > 0) console.log(queue);
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
        $(gizmo).find('.metric.calls-in-queue').text(callsInQueue);
        $(gizmo).find('.metric.max-wait').text(waitString);
        $(gizmo).find('.department-name').html(name);
    });

    // Clear old messages
    $('#message').text('');

    // Update clock
    $('.clock').text(formatAMPM(new Date()));
}


// Make a request to server with given parameters (from getParameters)
async function request(parameters) {
    const apiURL = 'http://localhost:3000/';

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
function getParameters(requestType) {
    let params = {};

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
    if (requestType == 'ACDStatus') {
        params = {
            'service': 'getStatistics',
            'settings': [ {
                'statisticType': 'ACDStatus'
            } ]
        }
    }
    // Credentials
    let user = $('.credentials.username').val();
    let pass = $('.credentials.password').val();
    let auth = user + ':' + pass;
    params['authorization'] = btoa(auth); // Base 64 encryption. Yum!

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
function formatJSON(json,
                    includeFields=['Skill Name', 'Calls In Queue',
                                   'Current Longest Queue Time']) {
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
