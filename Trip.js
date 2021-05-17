const mongoose = require("mongoose");

const trip = new mongoose.Schema(
  {
    userId: {
      required: true,
      type: String,
    },
    allData: {
      required: true,
      type: Object,
    },
    routeData: {
      required: true,
      type: Object,
    },
    poiDetails: {
      required: true,
      type: Object,
    },
    form: {
      required: true,
      type: Object,
    },
    public: {
      required: true,
      type: Boolean,
    },
    created: {
      required: true,
      type: Date,
    },
    updated: {
      required: true,
      type: Date,
    },
  },
  { collection: "itineraryTrips" }
);

module.exports = mongoose.model("Trip", trip);
