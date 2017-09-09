

$(document).ready(() => {
    let timeout = null;

    // show Login form
    $('.credentials-cover-toggle').click(() => {
        $('.credentials-form').removeClass('out-of-the-way');
        $('.credentials-cover').addClass('out-of-the-way');
    });

    // listen for sign-in button press
    $('.begin-session').click(async () => {
        if (timeout != null) {
            clearTimeout(timeout);
        }

        // clear Five9 credentials box
        $('.credentials-form').addClass('out-of-the-way');
        $('.credentials-cover').removeClass('out-of-the-way');

        const success = await beginSession();

        try {
            timeout = await run();
        } catch (err) {
            error(err, 'Full authenticated?');
        }
    });

    // Handle menus to change skills
    $('.skills-edit-toggle').click(() => $('.modal').css('display', 'block'));
    $('.close').click(() => $('.modal').css('display', 'none'));
    $(window).click((event) => {
        if ($(event.target).is('.modal'))
            $('.modal').css('display', 'none');
    })
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
        console.log(data);
        data = data['soap:Envelope']['soap:Body'][0]
                   ['ns2:getStatisticsResponse'][0]['return'][0];

        // Parse the data and pass it to the view updater
        refreshView(formatJSON(data));

        // restart loop
        return setTimeout(() => {
            eventLoop(interval);
        }, interval);
    }

    try {
        return await eventLoop(3000);
    } catch (err) {
        error(err, 'Error while running event loop.');
    }
}


function error(err, message) {
    // timestamp
    var newDate = new Date();
    newDate.setTime(Date.now());
    dateString = newDate.toTimeString();
    console.log(dateString);

    $('#message').text(`Whoops! An error occurred when fetching data:   ${err.message}. ${message}`);
    console.error(err);
    throw Error(err);
}




// Takes nicely formatted data. Updates dashboard view.
function refreshView(data) {
    // Determine calls in queue & max wait
    let callsInQueue = 0;
    let maxWait = 0;
    for (let i=0; i < data.length; i++) {
        let queue = data[i];
        callsInQueue += queue['Calls In Queue'] * 1;
        maxWait = Math.max(maxWait, queue['Current Longest Queue Time'] * 1);
        if (queue['Current Longest Queue Time'] * 1 > 0) console.log(queue);
    }

    // Update view
    $('.metric.calls-in-queue').text(callsInQueue);

    // Format time from seconds to MM:SS or HH:MM:SS
    let waitString;
    const wait = new Date(null);
    wait.setSeconds(maxWait);
    if (maxWait < 3600) {
        waitString = wait.toISOString().substr(14, 5);
URL    } else {
        waitString = wait.toISOString().substr(11, 8);
    }
    $('.metric.max-wait').text(waitString);

    // Clear old messages
    $('#message').text('');

    // Update clock

}


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
            console.log(response.status);
            return response;
        }).catch((err) => {
            error(err);
        });
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
