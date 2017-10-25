const chai = require('chai');
const should = chai.should();
const csv = require('csvtojson');

// Database schema & model definition
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const report = require('../src/models/report');

const moment = require('moment');

// const data = [];parse
// const parser = parse({ delimiter: ',' });

mongoose.connect('mongodb://localhost/testcsvimport');

describe('CSV test', () => {
    it('Should update database', async () => {
        const csvString = "SKILL,DATE,Global.strSugarZipCode,CALLS\nCare,2017-10-22,76648-4511,50\nTech,2017-10-21,68643-4342,25";
        const csvHeaderLine = csvString.substr(0, csvString.indexOf('\n'));
        const data = [];

        await csv( { delimiter: ',', headers: report.getHeadersFromCsv(csvHeaderLine) } )
            .fromString("SKILL,DATE,Global.strSugarZipCode,CALLS\nCare,2017-10-22,76648-4511,50\nTech,2017-10-21,68643-4342,25")
            .on('json', (res) => {
                console.log(res);
                res.date = moment(res.date, 'YYYY-MM-DD').toDate();
                data.push(res);
            });
        console.log(data);

        return report.Report.collection.insert(data, (err, docs) => {
            console.log('err' + err);
            console.log(docs);
        });

    });
});
