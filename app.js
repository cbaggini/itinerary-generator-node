const helper = require("./helper");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

app.get("/", (req, res) => {
  res.send("Welcome to the itinerary generator!");
});

app.get("/geocode", (req, res) => {
  helper
    .geocode(req.query.text)
    .then((response) => res.send(response))
    .catch((err) => res.send(err));
});

app.get("/poi", (req, res) => {
  helper
    .getPoiInfo(req.query.xid)
    .then((response) => res.send(response))
    .catch((err) => res.send(err));
});

app.post("/itinerary", (req, res) => {
  helper
    .getRoute(req.body.coordinates, req.body.radius, req.body.categories)
    .then((response) => res.send(response))
    .catch((err) => res.send(err));
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});

module.exports = app;
