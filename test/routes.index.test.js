process.env.NODE_ENV = 'test';
const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

const server = require('../server/routes/index');

describe('routes : index', () => {
    describe('POST /', () => {
        it('should return JSON', (done) => {
            chai.request(server)
            .post('/')
            .send({a: 1, b: 2})
            .end((err, res) => {
                should.not.exist(err);
                res.status.should.eql(200);
                res.type.should.eql('application/json');
                done();
            });
        });
    });
});
