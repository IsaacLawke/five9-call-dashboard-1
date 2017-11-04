const csv = require('csvtojson'); // CSV parsing
const five9 = require('../helpers/five9-interface'); // Five9 interface helper functions
const log = require('../helpers/log'); // recording updates
const moment = require('moment'); // dates/times
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;



//////////////////////////////////////////
// MongoDB database definitions
//////////////////////////////////////////
// Schema for report data
const callsByZipSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    skill: String,
    zipCode: String,
    date: Date,
    calls: { type: Number, default: 0 }
});

const serviceLevelSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    skill: String,
    date: Date,
    calls: { type: Number, default: 0 },
    serviceLevel: { type: Number, default: 0 }
});

const dataFeedSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    skill: String,
    zipCode: String,
    date: Date,
    calls: { type: Number, default: 0 },
    serviceLevel: { type: Number, default: 0 }
});


// Models to represent report data
const CallsByZip   = mongoose.model('CallsByZip', callsByZipSchema);
const ServiceLevel = mongoose.model('ServiceLevel', serviceLevelSchema);
const DataFeed = mongoose.model('DataFeed', serviceLevelSchema);

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
let updateListeners = [];

// Update from Five9 every ${interval} seconds
// Returns ID for setTimeout timer
async function scheduleUpdate(interval) {
    currentlyUpdatingData = true;
    const time = {};
    time.start = moment().format('YYYY-MM-DD') + 'T00:00:00';
    time.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';

    // update from Five9
    await refreshDatabase(time, DataFeed, 'Dashboard - Data Feed');
    // await Promise.all([refreshDatabase(time, CallsByZip, 'Dashboard - Calls by Zip'),
    //                    refreshDatabase(time, ServiceLevel, 'Dashboard - SL Threshold 120sec')]);

    // Schedule next update
    currentlyUpdatingData = false;
    return setTimeout(() => scheduleUpdate(interval), interval);
}

// Get report data within timeFilter.start and timeFilter.stop
async function getServiceLevelData(timeFilter, reportModel) {
    const results = await DataFeed.find({
        date: {
            $gte: moment(timeFilter.start, 'YYYY-MM-DD[T]HH:mm:ss').toDate(),
            $lte: moment(timeFilter.end, 'YYYY-MM-DD[T]HH:mm:ss').toDate()
        },
    }, (err, data) => data);
    return results;
}

// Get report data within timeFilter.start and timeFilter.stop
async function getData(timeFilter, reportModel) {
    const results = await reportModel.find({
        date: {
            $gte: moment(timeFilter.start, 'YYYY-MM-DD[T]HH:mm:ss').toDate(),
            $lte: moment(timeFilter.end, 'YYYY-MM-DD[T]HH:mm:ss').toDate()
        }
    }, (err, data) => data);
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
        let listenerFunction = updateListeners.pop();
        listenerFunction();
    }
}


// Update Five9 data
async function refreshDatabase(time, reportModel, reportName) {
    log.message(`Updating report database at ${moment()} with ${reportName}`);

    const data = [];

    // Remove today's old data
    await reportModel.remove({
            date: {
                $gte: time.start,
                $lte: time.end
            }
        }, (err, success) => {
            console.log('delete err: ' + err);
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
                let datestring = res.date + ' ' + res['HALF HOUR'];
                delete res['HALF HOUR'];
                res.date = moment(datestring, 'YYYY/MM/DD HH:mm').toDate();
                data.push(res);
                return resolve(data);
            }).on('error', reject);
        });

    // Insert the new data
    return reportModel.collection.insert(data, (err, docs) => {
        console.log('insert err: ' + err);
        callbackUpdateListeners(); // TODO: call back when _all_ updates are done
        return reportModel.collection.stats((err, results) => {
            console.log('stats err: ' + err);
            console.log('count: ' + results.count + '. size: ' + results.size + 'b');
        });
    });
}


// Update Five9 data
async function refreshDatabase_OLD(time, reportModel, reportName) {
    log.message(`Updating report database at ${moment()} with ${reportName}`);

    const data = [];

    // Remove today's old data
    await reportModel.remove({
            date: {
                $gte: time.start,
                $lte: time.end
            }
        }, (err, success) => {
            console.log('delete err: ' + err);
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
                let datestring = res.date + ' ' + res['HALF HOUR'];
                delete res['HALF HOUR'];
                res.date = moment(datestring, 'YYYY/MM/DD HH:mm').toDate();
                data.push(res);
                return resolve(data);
            }).on('error', reject);
        });

    // Insert the new data
    return reportModel.collection.insert(data, (err, docs) => {
        console.log('insert err: ' + err);
        callbackUpdateListeners(); // TODO: call back when _all_ updates are done
        return reportModel.collection.stats((err, results) => {
            console.log('stats err: ' + err);
            console.log('count: ' + results.count + '. size: ' + results.size + 'b');
        });
    });
}


module.exports.CallsByZip = CallsByZip;
module.exports.ServiceLevel = ServiceLevel;
module.exports.getHeadersFromCsv = getHeadersFromCsv;
module.exports.addUpdateListener = addUpdateListener;
module.exports.scheduleUpdate = scheduleUpdate;
module.exports.getServiceLevelData = getServiceLevelData;
// module.exports.getZipCodeData = getZipCodeData;
