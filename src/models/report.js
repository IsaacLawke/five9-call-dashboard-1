/*
** Intermediate storage of Five9 data in MongoDB, to allow data cacheing and
** reduce the number of direct Five9 API requests / licenses required.
**
*/

const csv = require('csvtojson'); // CSV parsing
const five9 = require('../helpers/five9-interface'); // Five9 interface helper functions
const log = require('../helpers/log'); // recording updates
const moment = require('moment-timezone'); // dates/times
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;



//////////////////////////////////////////
// MongoDB database definitions
//////////////////////////////////////////
// Schema for report data
const dataFeedSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    skill: String,
    zipCode: String,
    date: Date,
    calls: { type: Number, default: 0 },
    serviceLevel: { type: Number, default: 0 },
});


// Model to represent report data
const DataFeed = mongoose.model('DataFeed', dataFeedSchema);

// Returns array with nice field names, from Five9 CSV report header string.
function getHeadersFromCsv(csvHeaderLine) {
    const oldHeaders = csvHeaderLine.split(',');
    const newHeaders = [];
    const lookup = {
        'SKILL':    'skill',
        'DATE':     'date',
        'Global.strSugarZipCode':   'zipCode',
        'CALLS':    'calls',
        'SERVICE LEVEL count':      'serviceLevel',
        'SERVICE LEVEL':            'serviceLevel'
    }
    for (let i=0; i < oldHeaders.length; i++) {
        let header = oldHeaders[i];
        // Assign the lookup value if this header is found; otherwise, leave it as is
        if (lookup.hasOwnProperty(header)) {
            newHeaders.push(lookup[header]);
        } else {
            newHeaders.push(header);
        }
    }
    return newHeaders;
}


//////////////////////////////////////////
// Database updating and access functions
//////////////////////////////////////////
let currentlyUpdatingData = false;

// Update from Five9 every ${interval} seconds
// Returns ID for setTimeout timer
async function scheduleUpdate(interval) {
    currentlyUpdatingData = true;
    const time = {};
    time.start = moment().format('YYYY-MM-DD') + 'T00:00:00';
    time.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';

    // update from Five9
    await loadData(time);

    // Schedule next update
    currentlyUpdatingData = false;
    return setTimeout(() => scheduleUpdate(interval), interval);
}

/**
 * Re-load data to database. This function directly forces the database to
 * be updated in a given time range, as apposed to `scheduleUpdate`, which
 * manages its own start and end times.
 * @param  {Object} time object with 'start' and 'end' values
 *                          in format 'YYYY-MM-DDThh:mm:ss'
 * @return {Promise}
 */
async function loadData(time) {
    return await refreshDatabase(time, DataFeed, 'Dashboard - Data Feed');
}

// Summarize call and service level data by skill. Params should give start
// and end time for data.
async function getServiceLevelData(params) {
    return new Promise((resolve, reject) => {
        DataFeed.aggregate( [
            // Filter for the selected date and skills
            { $match:
                { date: {
                    $gte: moment(params.start, 'YYYY-MM-DD[T]HH:mm:ss').toDate(),
                    $lte: moment(params.end, 'YYYY-MM-DD[T]HH:mm:ss').toDate()
                } }
            },
            // Summarize by skill
            { $group: {
                _id: '$skill',
                calls: { $sum: '$calls' },
                serviceLevel: { $sum: '$serviceLevel' }
            } },
            { $project: { // name key as `skill` instead of `_id`
                _id: 0,
                skill: '$_id',
                calls: '$calls',
                serviceLevel: '$serviceLevel'
            } }
        // Respond with the data
        ], (err, data) => {
            if (err) reject(err);
            resolve(data);
        })
    });
}

// Summarize data by zip code. Params should give start time, end time, and
// skills to filter for.
async function getZipCodeData(params) {
    // Filter for matching (case-insensitive) skill names
    let skillFilter = params.skills.split(',').map((skillName) => {
        return { 'skill': { '$regex': skillName.trim(), '$options': 'i' } };
    });

    return new Promise((resolve, reject) => {
        DataFeed.aggregate( [
            // Filter for the selected date and skills
            { $match: { $and: [
                { date: {
                    $gte: moment(params.start, 'YYYY-MM-DD[T]HH:mm:ss').toDate(),
                    $lte: moment(params.end, 'YYYY-MM-DD[T]HH:mm:ss').toDate()
                } }, //date
                { $or: skillFilter } // skills
            ] } },
            // Summarize by zip code
            { $group: {
                _id: '$zipCode',
                calls: { $sum: '$calls' }
            } },
            { $project: { // name key as `zipCode` instead of `_id`
                _id: 0,
                zipCode: '$_id',
                calls: '$calls'
            } }
        // Respond with the data
        ], (err, data) => {
            if (err) reject(err);
            resolve(data);
        })
    });
}

// Get all report data within timeFilter.start and timeFilter.stop
async function getData(timeFilter, reportModel) {
    const results = await reportModel.find({
        date: {
            $gte: moment(timeFilter.start, 'YYYY-MM-DD[T]HH:mm:ss').toDate(),
            $lte: moment(timeFilter.end, 'YYYY-MM-DD[T]HH:mm:ss').toDate()
        }
    });
    return results;
}


// Update Five9 data in MongoDB
async function refreshDatabase(time, reportModel, reportName) {
    log.message(`Updating Report database with ${reportName}`);
    const data = [];

    // Remove today's old data
    await new Promise ((resolve, reject) => {
        reportModel.remove({
            date: {
                $gte: time.start,
                $lte: time.end
            }
        }, (err, success) => {
            if (err) {
                log.error(`Error deleting data in report model: ${err}`);
                reject(err);
            } else {
                resolve(success);
            }
        });
    });

    // Get CSV data
    // Calls by zips data
    const reportParameters = five9.getParameters('runReport', null,
                        criteriaTimeStart=time.start, criteriaTimeEnd=time.end, reportName);
    const csvData = await five9.getReportResults(reportParameters);
    const csvHeader = csvData.substr(0, csvData.indexOf('\n'));


    // Parse CSV data
    await new Promise((resolve, reject) => { // wrap in promise to allow await
        csv( { delimiter: ',', headers: getHeadersFromCsv(csvHeader) } )
            .fromString(csvData)
            .on('json', (res) => {
                // cast calls and SL as numbers
                res['calls'] *= 1;
                res['serviceLevel'] *= 1;

                // Leave only left 5 digits of zip code
                res['zipCode'] = res['zipCode'].substr(0, 5);

                // Set interval in Date format
                let datestring = res.date + ' ' + res['HALF HOUR'];
                delete res['HALF HOUR'];
                res.date = moment.tz(moment(datestring, 'YYYY/MM/DD HH:mm'), 'America/Los_Angeles').toDate();

                data.push(res);
                return resolve(data);
            }).on('error', reject);
        });

    // Insert the new data
    return new Promise ((resolve, reject) => {
        reportModel.collection.insert(data, (err, docs) => {
            if (err) {
                log.error(`Error inserting data in report model: ${err}`);
                reject(err);
            }
            callbackUpdateListeners();
            resolve(docs);
        });
    });
}



// Store callbacks that come in while the database is updating
// Once DB update's finished, call them back in refreshDatabase()
let updateListeners = [];
async function addUpdateListener(fun) {
    if (currentlyUpdatingData) {
        log.message(`API request arrived while updating Report database. Adding updateListener.`);
        updateListeners.push(fun);
    } else {
        fun();
    }
}

async function callbackUpdateListeners() {
    for (var i=0; i < updateListeners.length; i++) {
        let listenerFunction = updateListeners.pop();
        log.message(`callbackUpdateListeners after Report refresh: calling ${listenerFunction.name}`);
        listenerFunction();
    }
}


module.exports.getHeadersFromCsv = getHeadersFromCsv;
module.exports.addUpdateListener = addUpdateListener;
module.exports.scheduleUpdate = scheduleUpdate;
module.exports.getServiceLevelData = getServiceLevelData;
module.exports.getZipCodeData = getZipCodeData;
module.exports.DataFeed = DataFeed;
module.exports.refreshDatabase = refreshDatabase;
module.exports.loadData = loadData;
