const calculator = require("./calculator");
const validator = require("./validator");

const express = require("express");
const cors = require("cors");

let app = express();
app.disable("x-powered-by");

const PORT = process.env.PORT || 8080;
const ORIGIN = process.env.PORT
  ? "https://itinerary-generator.netlify.app"
  : "*";

const corsOptions = {
  origin: ORIGIN,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: "20mb" }));

app.get("/", (req, res) => {
  res.send("Welcome to the itinerary generator!");
});

app.get("/geocode", (req, res) => {
  const searchText = req.query.text;
  if (searchText) {
    calculator
      .geocode(req.query.text)
      .then((response) => res.json(response))
      .catch((err) => res.send(err));
  } else {
    res.status(400).json({ error: "missing required query parameter text" });
  }
});

app.get("/poi", (req, res) => {
  calculator
    .getPoiInfo(req.query.xid)
    .then((response) => res.send(response))
    .catch((err) => res.send(err));
});

app.post("/itinerary", (req, res) => {
  if (validator.itineraryInputValidation(req.body)) {
    calculator
      .getRoute(req.body.coordinates, req.body.radius, req.body.categories)
      .then((response) => res.json(response))
      .catch((err) => res.send(err));
  } else {
    res.status(400).json({ error: "Invalid input" });
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});

module.exports = app;
