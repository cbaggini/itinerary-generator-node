const mongoose = require("mongoose");

const user = new mongoose.Schema(
  {
    googleId: {
      required: false,
      type: String,
    },
    githubId: {
      required: false,
      type: String,
    },
    username: {
      required: true,
      type: String,
    },
  },
  { collection: "itineraryUsers" }
);

module.exports = mongoose.model("User", user);
