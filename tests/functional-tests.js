const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../app");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  suite("Routing tests", function () {
    suite("home", function () {
      test("home", function (done) {
        chai
          .request(server)
          .get("/")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal("Welcome to the itinerary generator!", res.text);
            done();
          });
      });
    });
    suite("geocode", function () {
      test("geocode valid city name", function (done) {
        chai
          .request(server)
          .get("/geocode?text=birmingham")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, "queryData");
            assert.isObject(res.body.queryData);
            assert.property(res.body.queryData, "features");
            assert.isArray(res.body.queryData.features);
            assert.isAtLeast(res.body.queryData.features.length, 1);
            done();
          });
      });
      test("geocode without city name", function (done) {
        chai
          .request(server)
          .get("/geocode?text=")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, "queryData");
            assert.isObject(res.body.queryData);
            assert.property(res.body.queryData, "geocoding");
            assert.isObject(res.body.queryData.geocoding);
            assert.property(res.body.queryData.geocoding, "errors");
            assert.isArray(res.body.queryData.geocoding.errors);
            assert.equal(res.body.queryData.geocoding.errors.length, 1);
            assert.equal(
              res.body.queryData.geocoding.errors[0],
              "invalid param 'text': text length, must be >0"
            );
            done();
          });
      });
      test("geocode without text field", function (done) {
        chai
          .request(server)
          .get("/geocode")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.deepEqual(res.body, {});
            done();
          });
      });
    });
    suite("itinerary", function () {
      // test("Test POST /api/books with no title given", function (done) {
      //   chai
      //     .request(server)
      //     .post("/api/books")
      //     .set("content-type", "application/x-www-form-urlencoded")
      //     .send({
      //       fakeField: "test tile",
      //     })
      //     .end(function (err, res) {
      //       assert.equal(res.status, 400);
      //       assert.equal(res.text, "missing required field title");
      //       done();
      //     });
      // });
    });
  });
});
