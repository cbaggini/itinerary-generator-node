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
            assert.equal(res.status, 400);
            assert.isObject(res.body);
            assert.property(res.body, "error");
            assert.equal(
              res.body.error,
              "missing required query parameter text"
            );
            done();
          });
      });
      test("geocode without text field", function (done) {
        chai
          .request(server)
          .get("/geocode")
          .end(function (err, res) {
            assert.equal(res.status, 400);
            assert.isObject(res.body);
            assert.property(res.body, "error");
            assert.equal(
              res.body.error,
              "missing required query parameter text"
            );
            done();
          });
      });
    });
    suite("itinerary", function () {
      test("get itinerary information with valid start and end points", function (done) {
        chai
          .request(server)
          .post("/itinerary")
          .set("content-type", "application/json")
          .send(
            JSON.stringify({
              coordinates: [
                [-1.85944, 52.482098],
                [-0.099076, 51.509648],
              ],
              radius: "12",
              categories: ["natural"],
            })
          )
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, "buffered");
            assert.property(res.body, "updatedRoute");
            assert.property(res.body, "pois");
            assert.property(res.body, "selectedPoisArray");
            done();
          });
      });
      test("get itinerary information without submitting coordinates", function (done) {
        chai
          .request(server)
          .post("/itinerary")
          .set("content-type", "application/json")
          .send(
            JSON.stringify({
              coordinates: [],
              radius: "12",
              categories: ["natural"],
            })
          )
          .end(function (err, res) {
            assert.equal(res.status, 400);
            assert.property(res.body, "error");
            assert.equal(res.body.error, "Invalid input");
            done();
          });
      });
    });
    suite("poi", function () {
      // test("get itinerary information with valid start and end points", function (done) {
      //   chai
      //     .request(server)
      //     .post("/itinerary")
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
