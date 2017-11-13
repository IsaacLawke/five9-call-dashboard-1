const five9 = require('../helpers/five9-interface');
const log = require('../helpers/log');
const mongoose = require('mongoose');


//////////////////////////////////////////
// MongoDB database definitions
//////////////////////////////////////////
// Schema for queue data
const queueStatsSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    SkillName: { type: String, default: 'N/A' },
    AgentsLoggedIn: { type: String, default: '0 (0)' },
    AgentsNotReadyForCalls: { type: Number, default: 0 },
    AgentsOnCall: { type: Number, default: 0 },
    AgentsReadyForCalls: { type: Number, default: 0 },
    AgentsReadyForVMs: { type: Number, default: 0 },
    CallsInQueue: { type: Number, default: 0 },
    CurrentLongestQueueTime: { type: Number, default: 0 },
    LongestQueueTime: { type: Number, default: 0 },
    QueueCallbacks: { type: Number, default: 0 },
    TotalVMs: { type: Number, default: 0 },
    VMsInProgress: { type: Number, default: 0 },
    VMsInQueue: { type: Number, default: 0 }
});

// Stats model
const QueueStats = mongoose.model('QueueStats', queueStatsSchema);

//////////////////////////////////////////
// Database updating
let currentlyUpdatingData = false;
// Update from Five9 every ${interval} seconds
// Returns ID for setTimeout timer
async function scheduleUpdate(interval) {
    currentlyUpdatingData = true;

    // ensure session is open
    await five9.openStatisticsSession();

    // update from Five9
    await refreshDatabase();

    // Schedule next update
    currentlyUpdatingData = false;
    return setTimeout(() => scheduleUpdate(interval), interval);
}

async function refreshDatabase() {
    log.message(`Updating QueueStats database`);
    let params, response, data;

    // Remove all old data
    await QueueStats.remove({});

    try {
        // Pull in the new stuff
        params = five9.getParameters('ACDStatus');
        response = await five9.request(params, 'statistics');
        // Get the data into a nice JSON / DB friendly format with keys + values
        // for each document
        data = jsonToViewData(response);

        debugger;
        // add to database
        return QueueStats.collection.insert(data, (err, docs) => {
            if (err) log.error(`Error inserting data in report model: ${err}`);
            callbackUpdateListeners();
        });
    } catch (err) {
        log.error(`Error during QueueStats update. Error: ${JSON.stringify(err)}; `
                  + `Data: ${JSON.stringify(data)}; `
                  + `openStatisticsSession response: ${JSON.stringify(response)}`);
    }
}


async function getData() {
    return await QueueStats.find({});
}

// Store callbacks that come in while the database is updating
// Once DB update's finished, call them back in refreshDatabase()
let updateListeners = [];
async function addUpdateListener(fun) {
    if (currentlyUpdatingData) {
        log.message(`API request arrived while updating QueueStats database. Adding updateListener.`);
        updateListeners.push(fun);
    } else {
        fun();
    }
}

async function callbackUpdateListeners() {
    for (var i=0; i < updateListeners.length; i++) {
        let listenerFunction = updateListeners.pop();
        listenerFunction();
    }
}


// Return formatted column / key assignments
// Takes JSON generated from original Five9 SOAP API response
function jsonToViewData(json,
        includeFields=['SkillName', 'CallsInQueue',
                        'CurrentLongestQueueTime', 'AgentsLoggedIn',
                        'AgentsNotReadyForCalls', 'AgentsOnCall',
                        'AgentsReadyForCalls']) {

    // Remove spaces from column headers
    let columns = json['columns'][0]['values'][0]['data'];
    columns = columns.map((header, i) => header.replace(/ /g, ''));

    let rows = json['rows'];
    let data = [];

    for (let i=0; i < rows.length; i++) {
        let row = rows[i]['values'][0]['data'];
        let newRow = {};
        for (let j=0; j < includeFields.length; j++) {
            let field = includeFields[j];
            newRow[field] = row[columns.indexOf(field)];

            // trim extra 0's to convert longest queue time to seconds from ms
            if (field == 'CurrentLongestQueueTime' && newRow[field].length > 3)
                newRow[field] = newRow[field].slice(0, -3);

            // Convert to number if needed in Schema
            if (!QueueStats.schema.paths[field]) {
                log.error(`could not find statistics field ${field}`);
            }
            else if (QueueStats.schema.paths[field].instance == 'Number') {
                newRow[field] = parseInt(newRow[field]);
            }
        }
        data.push(newRow);
    }
    return data;
}


module.exports.scheduleUpdate = scheduleUpdate;
module.exports.getData = getData;
module.exports.addUpdateListener = addUpdateListener;
