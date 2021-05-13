const chaiHttp = require("chai-http");
const chai = require("chai");
const assert = chai.assert;
const server = require("../app");

chai.use(chaiHttp);

suite("Functional Tests", function () {
  suite("Routing tests", function () {
    let firstInsertedID;
    suite(
      "POST /api/books with title => create book object/expect book object",
      function () {
        test("Test POST /api/books with title", function (done) {
          chai
            .request(server)
            .post("/api/books")
            .set("content-type", "application/x-www-form-urlencoded")
            .send({
              title: "test title",
            })
            .end(function (err, res) {
              assert.equal(res.status, 200);
              assert.isObject(res.body);
              assert.property(res.body, "title");
              assert.property(res.body, "_id");
              firstInsertedID = res.body._id;
              done();
            });
        });

        test("Test POST /api/books with no title given", function (done) {
          chai
            .request(server)
            .post("/api/books")
            .set("content-type", "application/x-www-form-urlencoded")
            .send({
              fakeField: "test tile",
            })
            .end(function (err, res) {
              assert.equal(res.status, 400);
              assert.equal(res.text, "missing required field title");
              done();
            });
        });
      }
    );
  });
});
