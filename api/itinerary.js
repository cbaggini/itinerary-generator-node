const calculator = require("../controller/calculator");
const validator = require("../utilities/validator");

const geocode = (req, res) => {
  const searchText = req.query.text;
  if (searchText) {
    calculator
      .geocode(req.query.text)
      .then((response) => res.json(response))
      .catch((err) => res.send(err));
  } else {
    res.status(400).json({ error: "missing required query parameter text" });
  }
};

const poi = (req, res) => {
  if (req.query.xid) {
    calculator
      .getPoiInfo(req.query.xid)
      .then((response) => {
        if (response.poiInfo.xid) {
          res.json(response);
        } else {
          res.status(response.poiInfo.status).json(response.poiInfo.body);
        }
      })
      .catch((err) => res.send(err));
  } else {
    res.status(400).json({ error: "Missing required parameter xid" });
  }
};

const itinerary = (req, res) => {
  if (validator.itineraryInputValidation(req.body)) {
    calculator
      .getRoute(
        req.body.coordinates,
        req.body.buffer,
        req.body.categories,
        req.body.timeInterval
      )
      .then((response) => {
        if (response.updatedRoute) {
          res.json(response);
        } else {
          res.status(response.status).json(response.body);
        }
      })
      .catch((err) => res.send(err));
  } else {
    res.status(400).json({ error: "Invalid input" });
  }
};

module.exports = { geocode, poi, itinerary };
