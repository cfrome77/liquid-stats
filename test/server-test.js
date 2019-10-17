let request = require('request');
let chai = require('chai');
let assert = require('chai').assert;
let expect = require('chai').expect;
let server = require('../app');
let should = chai.should();
let chaiHttp = require('chai-http');

chai.use(chaiHttp);

describe("/GET  home page",() => {
it('should return status 200 ', (done) => {
chai.request(server)
.get('/') 
.end((err, res) => {
  should.not.exist(err);
  should.exist(res);
  res.should.have.status(200);
  done();
  });
 });
});
