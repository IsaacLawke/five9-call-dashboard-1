// timeout to pause event loop when needed
let timeout = null;

// Object to manage the gizmos (queue widgets)
let gizmo = null;

$(document).ready(() => {
    gizmo = gizmoManager();

    // listen for sign-in button press
    $('.begin-session').click(async (event) => {
        // prevent redirection
        event.preventDefault();
        // stop any current event loops running
        if (timeout != null) {
            clearTimeout(timeout);
        }

        // Initiate a new session
        try {
            const success = await beginSession();
        } catch (err) {
            error(err, 'Not able to sign in to Five9. Check yo credentials!');
            return; // abort on failure
        }
        // begin updating data & page every few seconds
        try {
            runQueueDashboard();
        } catch (err) {
            error(err, 'Error occurred while queue dashboard was running.');
        }
    });

    // Update displayed queue list when user clicks button
    $('.show-skills-list').click(function (event) {
        const id = $(this).closest('.gizmo').attr('id');
        const thisgizmo = gizmo.gizmos[id];
        thisgizmo.showQueueList = !thisgizmo.showQueueList;
        const table = $(this).next('.queue-list');
        createQueueList(thisgizmo, table);
    });
});


async function runQueueDashboard() {
    async function eventLoop(interval) {
        // Get the current queue data
        let params = getParameters('ACDStatus');
        let response = await request(params);
        let data, slData;
        let time = {};

        try {
            data = await response.json();
            data = data['env:Envelope']['env:Body'][0]
                       ['ns2:getStatisticsResponse'][0]['return'][0];

            // Get SL stats
            time.start = moment().format('YYYY-MM-DD') + 'T00:00:00';
            time.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';
            slData = await getReportResults(time, 'service-level');

            // Parse the data and pass it to the view updater
            refreshView(jsonToViewData(data), slData);
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



// Takes nicely formatted data. Updates dashboard view.
// ${data} : ACD stats (current queue info)
// ${serviceLevel} : service level report
function refreshView(data, serviceLevelData) {
    // update each gizmo on the screen
    $('.gizmo').each((i, gizmoElement) => {
        const thisGizmo = gizmo.gizmos[gizmoElement.id];
        let name = thisGizmo.name;
        let skills = thisGizmo.skillFilter;
        // Clear old queue list from gizmo
        thisGizmo.queueList = [];

        // Determine calls and agent stats for this gizmo's skills
        let callsInQueue = 0,
            maxWait = 0,
            agentsLoggedIn = 0,
            agentsNotReady = 0,
            agentsOnCall = 0,
            agentsReady = 0,
            serviceLevel = 0,
            callsOffered = 0;

        for (let i=0; i < data.length; i++) {
            let queue = data[i];
            // Include skills in gizmo filter, or all skills if none are in filter
            if (skills.includes(queue['Skill Name']) || skills.length == 0) {
                // Real-time queue metrics
                callsInQueue += queue['Calls In Queue']*1;
                maxWait = Math.max(maxWait, queue['Current Longest Queue Time']*1);
                agentsLoggedIn = Math.max(agentsLoggedIn, queue['Agents Logged In'].split(' ')[0]*1);
                agentsNotReady = Math.max(agentsNotReady, queue['Agents Not Ready For Calls']*1);
                agentsOnCall = Math.max(agentsOnCall, queue['Agents On Call']*1);
                agentsReady = Math.max(agentsReady, queue['Agents Ready For Calls']*1);

                // SL metrics
                let metrics = serviceLevelData.reduce((totals, current) => {
                    if (current.skill == queue['Skill Name']) {
                        totals.serviceLevel += current.serviceLevel;
                        totals.calls += current.calls;
                    }
                    return totals;
                }, { serviceLevel: 0, calls: 0 });
                serviceLevel += metrics.serviceLevel;
                callsOffered += metrics.calls;

                // Add to list of skills in queue
                if (queue['Calls In Queue']*1 > 0) {
                    thisGizmo.queueList.push({
                        skillName: queue['Skill Name'],
                        callsInQueue: queue['Calls In Queue']*1,
                        maxWait: formatWaitTime(queue['Current Longest Queue Time']*1)
                    });
                }
            }
        }
        // Format wait time from seconds to MM:SS or HH:MM:SS
        let waitString = formatWaitTime(maxWait);

        // Update metrics
        let SLpercent = callsOffered == 0
            ? 'N/A'
            : Math.round(100 * serviceLevel / callsOffered) + '%';
        $(gizmoElement).find('.metric.service-level').text(SLpercent);
        $(gizmoElement).find('.calls-in-sl').text(serviceLevel);
        $(gizmoElement).find('.calls-out-of-sl').text(callsOffered - serviceLevel);

        $(gizmoElement).find('.metric.calls-in-queue').text(callsInQueue);
        $(gizmoElement).find('.metric.max-wait').text(waitString);
        $(gizmoElement).find('.agents-logged-in').text(agentsLoggedIn);
        $(gizmoElement).find('.agents-not-ready-for-calls').text(agentsNotReady);
        $(gizmoElement).find('.agents-on-call').text(agentsOnCall);
        $(gizmoElement).find('.agents-ready-for-calls').text(agentsReady);

        // Update queue list, if showing
        if (thisGizmo.showQueueList) {
            const table = $(gizmoElement).find('.queue-list');
            createQueueList(thisGizmo, table);
        }
    }); // gizmo.forEach

    // Clear old messages
    $('#message').text(' ');

    // Update clock
    $('.clock').text(formatAMPM(new Date()));
}


// Update queue list in DOM
// ${gizmo} object to build list on. ${table} element storing list.
function createQueueList(thisGizmo, table) {
    table.empty(); // clear old list
    // Sort by max wait time
    thisGizmo.queueList.sort((a, b) => a.maxWait > b.maxWait ? -1 : 1);
    // Add headers if not yet created
    if (thisGizmo.queueList[0] !== undefined &&
        thisGizmo.queueList[0].skillName != 'Skill Name') {
        thisGizmo.queueList.unshift({ skillName: 'Skill Name',
                            callsInQueue: 'Calls',
                            maxWait: 'Max Wait' });
    }
    // Update DOM from queueList
    thisGizmo.queueList.forEach((queue) => {
        const tr = document.createElement('tr');
        const td1 = document.createElement('td');
        td1.appendChild(document.createTextNode(queue.skillName));
        const td2 = document.createElement('td');
        td2.appendChild(document.createTextNode(queue.callsInQueue));
        const td3 = document.createElement('td');
        td3.appendChild(document.createTextNode(queue.maxWait));
        tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
        table.append(tr);
    });
}

// Turns seconds into nicely formatted MM:SS or HH:MM:SS
function formatWaitTime(seconds) {
    const wait = new Date(null);
    wait.setSeconds(seconds);
    if (seconds < 3600) { // MM:SS
        return wait.toISOString().substr(14, 5);
    }
    return wait.toISOString().substr(11, 8); // HH:MM:SS
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
