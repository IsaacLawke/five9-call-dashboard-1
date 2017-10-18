// timeout to pause event loop when needed
let timeout = null;

let gizmo = null;

$(document).ready(() => {
    let callMap = new CallMap();

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

        // await beginSession();
        await updateMap(callMap);
        console.log('finished updateMap()!');
    });
});


// Update callMap (d3 map object) based on parameters in page
async function updateMap(callMap) {
    const startTime = $('.filter.start-time').val();
    const endTime = $('.filter.end-time').val();

    const params = getParameters('runReport', null, startTime, endTime);
    const csvData = await getReportResults(params);

    const data = d3.csvParse(csvData);
    data.forEach((d) => {
        d.CALLS = +d.CALLS;
    });

    callMap.update(data);
}


async function runQueueDashboard() {
    async function eventLoop(interval) {
        // Get the data
        let params = getParameters('ACDStatus');
        let response = await request(params);
        let data;

        try {
            data = await response.json();
            data = data['env:Envelope']['env:Body'][0]
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


// Breaks down "skill1, skill2 , skill3" string
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
