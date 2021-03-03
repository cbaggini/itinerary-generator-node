const helper = require("./helper");

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

const PORT = process.env.PORT || 8080;
const ORIGIN = process.env.PORT
  ? "https://itinerary-generator.netlify.app"
  : "*";

const corsOptions = {
  origin: ORIGIN,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

// TODO: setup CORS for localhost or Netlify frontend
app.use(cors(corsOptions));
app.use(bodyParser.json());

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
