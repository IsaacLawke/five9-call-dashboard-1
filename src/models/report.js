const mongoose = require('mongoose');

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


module.exports.Report = Report;
module.exports.getHeadersFromCsv = getHeadersFromCsv;
