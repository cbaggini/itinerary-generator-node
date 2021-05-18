const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../app");

const tripData = require("./tripData");

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
              buffer: "12",
              categories: ["natural"],
              timeInterval: "12600",
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
              buffer: "12",
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
      test("get poi information with valid xid", function (done) {
        chai
          .request(server)
          .get("/poi?xid=195951")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, "poiInfo");
            done();
          });
      });
      test("get poi information with invalid xid", function (done) {
        chai
          .request(server)
          .get("/poi?xid=hey")
          .end(function (err, res) {
            assert.equal(res.status, 500);
            assert.isObject(res.body);
            assert.equal(res.body.error, "POI details could not be fetched");
            done();
          });
      });
      test("get poi information without xid", function (done) {
        chai
          .request(server)
          .get("/poi?xid=")
          .end(function (err, res) {
            assert.equal(res.status, 400);
            assert.isObject(res.body);
            assert.equal(res.body.error, "Missing required parameter xid");
            done();
          });
      });
    });
    suite("trips", function () {
      test("get all trips for a user with user id", function (done) {
        chai
          .request(server)
          .get("/trips/60a14506076db745479a7de2")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], "routeData");
            done();
          });
      });
      test("create a new trip", function (done) {
        chai
          .request(server)
          .post("/trips")
          .set("content-type", "application/json")
          .send(
            JSON.stringify({
              ...tripData,
              userId: "60a14506076db745479a7de2",
              created: new Date(),
              updated: new Date(),
            })
          )
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, "message");
            assert.equal(res.body.message, "saved");
            done();
          });
      });
      test("create a new trip without user Id", function (done) {
        chai
          .request(server)
          .post("/trips")
          .set("content-type", "application/json")
          .send(
            JSON.stringify({
              ...tripData,
              created: new Date(),
              updated: new Date(),
            })
          )
          .end(function (err, res) {
            assert.equal(res.status, 400);
            assert.isObject(res.body);
            assert.property(res.body, "error");
            assert.equal(res.body.error, "Missing userId");
            done();
          });
      });
      let createdTripId;
      test("get latest ten public trips in database", function (done) {
        chai
          .request(server)
          .get("/trips")
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.isAtMost(res.body.length, 10);
            assert.property(res.body[0], "public");
            assert.equal(res.body[0].public, true);
            createdTripId = res.body[0]._id;
            done();
          });
      });
      test("change trip from public to private", function (done) {
        chai
          .request(server)
          .put("/trips/" + createdTripId)
          .set("content-type", "application/json")
          .send(JSON.stringify({ newData: { public: false } }))
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, "message");
            assert.equal(res.body.message, "Successfully saved.");
            done();
          });
      });
      test("delete trip", function (done) {
        chai
          .request(server)
          .delete("/trips/" + createdTripId)
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.isObject(res.body);
            assert.property(res.body, "message");
            assert.equal(res.body.message, "Successfully deleted.");
            done();
          });
      });
      test("delete trip without trip id", function (done) {
        chai
          .request(server)
          .delete("/trips/")
          .end(function (err, res) {
            assert.equal(res.status, 404);
            done();
          });
      });
      test("delete trip with invalid trip id", function (done) {
        chai
          .request(server)
          .delete("/trips/bb")
          .end(function (err, res) {
            assert.equal(res.status, 400);
            assert.isObject(res.body);
            assert.property(res.body, "error");
            assert.equal(res.body.error, "Trip not found");
            done();
          });
      });
    });
  });
});
