const itinerary = require("./api/itinerary");

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

app.get("/geocode", itinerary.geocode);

app.get("/poi", itinerary.poi);

app.post("/itinerary", itinerary.itinerary);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});

module.exports = app;
