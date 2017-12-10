process.env.NODE_ENV = 'test';
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const moment = require('moment');

// This file must be created with exports goodUsername, goodPassword,
// badUsername, badPassword, and sampleSkills for map checks
const secure = require('./secure_settings.test');

chai.use(chaiHttp);
const server = require('../src/app');

describe('Testing security (credentials authentication).', function() {
    this.timeout(60000); // allow 60 seconds to complete test

    // Set up test scenarios to iterate through
    let combos = {
        allGood: {
            auth: secure.goodUsername + ':' + secure.goodPassword,
            desc: 'Credentials all good: should return success with JSON',
            status: 200,
            test: (res) => res.type.should.eql('application/json')
        },
        userBad: {
            auth: secure.badUsername + ':' + secure.goodPassword,
            desc: 'Username bad: should return 401 Unauthorized',
            status: 401,
            test: (res) => res.type.should.eql('application/text')
        },
        passwordBad: {
            auth: secure.goodUsername + ':' + secure.badPassword,
            desc: 'Password bad: should return 401 Unauthorized',
            status: 401,
            test: (res) => res.type.should.eql('application/text')
        },
        allBad: {
            auth: secure.badUsername + ':' + secure.badPassword,
            desc: 'Credentials all bad: should return 401 Unauthorized, ya turkey',
            status: 401,
            test: (res) => res.type.should.eql('application/text')
        }
    };
    for (const key in combos) {
        combos[key].auth = new Buffer(combos[key].auth).toString('base64');
    }

    let endpoints = [
        'reports/service-level', 'reports/maps', 'queue-stats', 'reports/customers'
    ];

    const params = {};
    params.start = moment().format('YYYY-MM-DD') + 'T00:00:00';
    params.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';
    params.skills = 'Care,Tech,Sales'; // for maps endpoint

    // Check each API endpoint
    for (let i in endpoints) {
        describe(`POST ${endpoints[i]}`, () => {
            // Test endpoint with each scenario
            for (const key in combos) {
                const scenario = combos[key];
                it(scenario.desc + ' - Testing status and response type', (done) => {
                    chai.request(server)
                    .post(`/api/${endpoints[i]}`)
                    .send(Object.assign(params, { authorization: scenario.auth }))
                    .end((err, res) => {
                        res.status.should.eql(scenario.status);
                        scenario.test(res);
                        done();
                    });
                });
            }
        });
    }

});
