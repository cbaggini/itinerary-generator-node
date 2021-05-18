const itinerary = require("./api/itinerary");

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github").Strategy;
const mongoose = require("mongoose");

const User = require("./User");
const Trip = require("./Trip");

const PORT = process.env.PORT || 8080;
const ORIGIN = process.env.PORT
  ? "https://itinerary-generator.netlify.app"
  : "http://localhost:3000";
const BASE_URL = process.env.PORT
  ? "https://itinerary-generator.netlify.app/"
  : "http://localhost:3000/";

const corsOptions = {
  origin: ORIGIN,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true,
};

let app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

let sessionOptions = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {
    sameSite: "none",
    // secure: true,
    maxAge: 1000 * 60 * 60 * 24 * 7, // One Week
  },
};

if (process.env.PORT) {
  sessionOptions.cookie.secure = true;
}

app.use(session(sessionOptions));

app.use(cors(corsOptions));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: false, limit: "20mb" }));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(
  `${process.env.DB}`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
  () => {}
);

passport.serializeUser((user, done) => {
  return done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, doc) => {
    // Whatever we return goes to the client and binds to the req.user property
    return done(null, doc);
  });
});

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: `${process.env.GOOGLE_CLIENT_ID}`,
      clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
      callbackURL: "/auth/google/callback",
    },
    function (_, __, profile, cb) {
      User.findOne({ googleId: profile.id }, async (err, doc) => {
        if (err) {
          return cb(err, null);
        }

        if (!doc) {
          const newUser = new User({
            googleId: profile.id,
            username: profile.name.givenName,
          });

          await newUser.save();
          cb(null, newUser);
        }
        cb(null, doc);
      });
    }
  )
);

passport.use(
  "github",
  new GitHubStrategy(
    {
      clientID: `${process.env.GITHUB_CLIENT_ID}`,
      clientSecret: `${process.env.GITHUB_CLIENT_SECRET}`,
      callbackURL: "/auth/github/callback",
    },
    function (_, __, profile, cb) {
      User.findOne({ githubId: profile.id }, async (err, doc) => {
        if (err) {
          return cb(err, null);
        }

        if (!doc) {
          const newUser = new User({
            githubId: profile.id,
            username: profile.username,
          });

          await newUser.save();
          cb(null, newUser);
        }
        cb(null, doc);
      });
    }
  )
);

app.get("/", (req, res) => {
  res.send("Welcome to the itinerary generator!");
});

app.get("/geocode", itinerary.geocode);

app.get("/poi", itinerary.poi);

app.post("/itinerary", itinerary.itinerary);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: BASE_URL,
    session: true,
  }),
  function (req, res) {
    res.redirect(BASE_URL + "profile");
  }
);

app.get("/auth/github", passport.authenticate("github"));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    failureRedirect: BASE_URL,
    session: true,
  }),
  function (req, res) {
    res.redirect(BASE_URL + "profile");
  }
);

app.get("/getuser", (req, res) => {
  res.send(req.user);
});

app.get("/auth/logout", (req, res) => {
  if (req.user) {
    req.logout();
    res.send("done");
  }
});

app.get("/trips", async (req, res) => {
  const selectedTrips = await Trip.find({ public: true })
    .sort({ updated: -1 })
    .limit(10);
  res.json(selectedTrips);
});

app.get("/trips/:userId", async (req, res) => {
  const userId = req.params.userId;
  const selectedTrips = await Trip.find({ userId: userId }).sort({
    updated: -1,
  });
  res.json(selectedTrips);
});

app.post("/trips", (req, res) => {
  if (req.body.userId) {
    Trip.create(req.body, function (err, small) {
      if (err) console.log(err);
    });
    res.json({ message: "saved" });
  } else {
    res.status(400).json({ error: "Missing userId" });
  }
});

app.put("/trips/:tripId", async (req, res) => {
  const tripId = req.params.tripId;
  if (tripId) {
    await Trip.findOneAndUpdate(
      { _id: tripId },
      { ...req.body.newData, updated: new Date() },
      { upsert: false },
      function (err, doc) {
        if (err) return res.status(500).json({ error: err });
      }
    );
    res.json({ message: "Successfully saved." });
  } else {
    res.status(400).json({ error: "Missing tripId" });
  }
});

app.delete("/trips/:tripId", async (req, res) => {
  const tripId = req.params.tripId;
  await Trip.findOneAndDelete({ _id: tripId }, function (err, doc) {
    if (err || !doc) {
      res.status(400).json({ error: "Trip not found" });
    } else {
      res.json({ message: "Successfully deleted." });
    }
  });
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log("Press Ctrl+C to quit.");
});

module.exports = app;
