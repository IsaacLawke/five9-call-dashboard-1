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
    
});
