
const gizmos = {};
let openGizmoMenu = null;

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
            run();
        } catch (err) {
            error(err, 'Full authenticated?');
        }
    });


    // Handle menu to change skills (modal)
    $('.skills-edit-toggle').click(function () {
        $('.modal').css('display', 'block');
        openGizmoMenu = $(this).parent().attr('id');
    });
    $('.close, .cancel, .save').click(() => $('.modal').css('display', 'none'));
    $(window).click((event) => {
        if ($(event.target).is('.modal'))
            $('.modal').css('display', 'none');
    })

    // Listen for skill filter updates
    $('.modal .save').click(() => {
        console.log('setting the settings for ' + openGizmoMenu);
        const name   = $('.modal .name').val();
        const skills = $('.modal .skills').val();
        if (!gizmos[openGizmoMenu]) gizmos[openGizmoMenu] = {};
        gizmos[openGizmoMenu].name        = name;
        gizmos[openGizmoMenu].skillFilter = skillStringToArray(skills);
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
}


// Takes nicely formatted data. Updates dashboard view.
function refreshView(data) {
    // update each gizmo on the screen
    $('.gizmo').each((i, gizmo) => {
        let skillFilter, name;
        try {
            console.log('updating view for ' + gizmo.id);
            skillFilter = gizmos[gizmo.id].skillFilter;
            name = gizmos[gizmo.id].name;
        } catch (e) {
            console.log('err on skills');
            skillFilter = [];
            name = 'Gizmo Widget';
        }
        console.log('skillfilter = ', skillFilter);

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

function skillStringToArray(skillString) {
    if (skillString == '') return [];
    return skillString.split(',');
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
