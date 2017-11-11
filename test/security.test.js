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

describe('testing security', function() {
    this.timeout(60000); // allow 60 seconds to complete test
    let auth = {
        allGood: secure.goodUsername + ':' + secure.goodPassword,
        userBad: secure.badUsername + ':' + secure.goodPassword,
        passwordBad: secure.goodUsername + ':' + secure.badPassword,
        allBad: secure.badUsername + ':' + secure.badPassword
    };
    for (const key in auth) {
        auth[key] = new Buffer(auth[key]).toString('base64');
    }
    const params = {};
    params.start = moment().format('YYYY-MM-DD') + 'T00:00:00';
    params.end   = moment().format('YYYY-MM-DD') + 'T23:59:59';

    describe('POST /api/reports/service-level', () => {
        // Test service-level endpoint
        it('Credentials all good: should return success with JSON', (done) => {
            chai.request(server)
            .post('/api/reports/service-level')
            .send( Object.assign(params, {authorization: auth.allGood}) )
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.type.should.eql('application/json');
                done();
            });
        });

        it('Username bad: should return 401 Unauthorized with text', (done) => {
            chai.request(server)
            .post('/api/reports/service-level')
            .send( Object.assign(params, {authorization: auth.userBad}) )
            .end((err, res) => {
                res.status.should.eql(401);
                res.type.should.eql('application/text');
                done();
            });
        });

        it('Password bad: should return 401 Unauthorized with text', (done) => {
            chai.request(server)
            .post('/api/reports/service-level')
            .send( Object.assign(params, {authorization: auth.passwordBad}) )
            .end((err, res) => {
                res.status.should.eql(401);
                res.type.should.eql('application/text');
                done();
            });
        });

        it('Username and password bad: should return 401 Unauthorized with text', (done) => {
            chai.request(server)
            .post('/api/reports/service-level')
            .send( Object.assign(params, {authorization: auth.allBad}) )
            .end((err, res) => {
                res.status.should.eql(401);
                res.type.should.eql('application/text');
                done();
            });
        });

        // Test maps/zipcode data endpoint
        it('Credentials all good: should return success with JSON', (done) => {
            chai.request(server)
            .post('/api/reports/maps')
            .send( Object.assign(params, {authorization: auth.allGood, skills: secure.sampleSkills}) )
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.type.should.eql('application/json');
                done();
            });
        });

        it('Username bad: should return 401 Unauthorized with text', (done) => {
            chai.request(server)
            .post('/api/reports/maps')
            .send( Object.assign(params, {authorization: auth.userBad, skills: secure.sampleSkills}) )
            .end((err, res) => {
                res.status.should.eql(401);
                res.type.should.eql('application/text');
                done();
            });
        });

        it('Password bad: should return 401 Unauthorized with text', (done) => {
            chai.request(server)
            .post('/api/reports/maps')
            .send( Object.assign(params, {authorization: auth.passwordBad, skills: secure.sampleSkills}) )
            .end((err, res) => {
                res.status.should.eql(401);
                res.type.should.eql('application/text');
                done();
            });
        });

        it('Username and password bad: should return 401 Unauthorized with text', (done) => {
            chai.request(server)
            .post('/api/reports/maps')
            .send( Object.assign(params, {authorization: auth.allBad, skills: secure.sampleSkills}) )
            .end((err, res) => {
                res.status.should.eql(401);
                res.type.should.eql('application/text');
                done();
            });
        });
    });

});
