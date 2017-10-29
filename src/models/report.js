const csv = require('csvtojson'); // CSV parsing
const five9 = require('../helpers/five9-interface'); // Five9 interface helper functions
const log = require('../helpers/log'); // recording updates
const moment = require('moment'); // dates/times
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

// Schema for report data
const reportSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    skill: String,
    zipCode: String,
    date: Date,
    calls: { type: Number, default: 0 }
});

// Model to represent report data
const Report = mongoose.model('Report', reportSchema);


// Returns array with nice field names, from Five9 CSV report header string.
function getHeadersFromCsv(csvHeaderLine) {
    const oldHeaders = csvHeaderLine.split(',');
    const newHeaders = [];
    const lookup = {
        'SKILL':    'skill',
        'DATE':     'date',
        'Global.strSugarZipCode': 'zipCode',
        'CALLS':    'calls'
    }
    for (let i=0; i < oldHeaders.length; i++) {
        let header = oldHeaders[i];
        if (lookup.hasOwnProperty(header)) {
            newHeaders.push(lookup[header]);
        } else {
            newHeaders.push(header);
        }
    }
    return newHeaders;
}


///////////////////////////////////////
// Database updating functions
///////////////////////////////////////
let currentlyUpdatingData = false;
let updateListeners = [];

// Update from Five9 every ${interval} seconds
async function scheduleUpdate(interval) {
    currentlyUpdatingData = true;
    const time = {};
    time.start = moment().format('YYYY-MM-DD') + 'T00:00:00';
    time.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';

    // update from Five9
    await refreshDatabase(time);

    // Schedule next update
    currentlyUpdatingData = false;
    return setTimeout(() => scheduleUpdate(interval), interval);
}

// Get report data within timeFilter.start and timeFilter.stop
async function getData(timeFilter) {
    const results = await Report.find({
        date: {
            $gte: moment(timeFilter.start, 'YYYY-MM-DD[T]HH:mm:ss').toDate(),
            $lte: moment(timeFilter.end, 'YYYY-MM-DD[T]HH:mm:ss').toDate()
        }
    }, (err, data) => {
        return JSON.stringify(data);
    });
    return results;
}


async function addUpdateListener(fun) {
    if (currentlyUpdatingData) {
        log.message(`Maps API request arrived while updating database. Adding updateListener.`);
        updateListeners.push(fun);
    } else {
        fun();
    }
}

async function callbackUpdateListeners() {
    for (var i=0; i < updateListeners.length; i++) {
        console.log('calling listener');
        let listenerFunction = updateListeners.pop();
        listenerFunction();
    }
}


// Update Five9 data
async function refreshDatabase(time) {
    log.message(`Updating report database at ${moment()}`);

    const data = [];

    // Remove today's old data
    await Report.remove({
            date: {
                $gte: time.start,
                $lte: time.end
            }
        }, (err, success) => {
            console.log('delete err: ' + err);
        });

    // Get CSV data
    const reportParameters = five9.getParameters('runReport', null,
                        criteriaTimeStart=time.start, criteriaTimeEnd=time.end);
    const csvData = await five9.getReportResults(reportParameters);
    const csvHeader = csvData.substr(0, csvData.indexOf('\n'));


    // Parse CSV data
    await new Promise((resolve, reject) => {
        csv( { delimiter: ',', headers: getHeadersFromCsv(csvHeader) } )
            .fromString(csvData)
            .on('json', (res) => {
                let datestring = res.date + ' ' + res['HALF HOUR'];
                delete res['HALF HOUR'];
                res.date = moment(datestring, 'YYYY/MM/DD HH:mm').toDate();
                data.push(res);
                return resolve(data);
            }).on('error', reject);
        });

    // Insert the new data
    return Report.collection.insert(data, (err, docs) => {
        console.log('insert err: ' + err);
        callbackUpdateListeners();
        return Report.collection.stats((err, results) => {
            console.log('stats err: ' + err);
            console.log('count: ' + results.count + '. size: ' + results.size + 'b');
        });
    });
}


module.exports.Report = Report;
module.exports.getHeadersFromCsv = getHeadersFromCsv;
module.exports.addUpdateListener = addUpdateListener;
module.exports.getData = getData;
module.exports.scheduleUpdate = scheduleUpdate;
