const app = require("express")();
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const flash = require("express-flash");
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }));
app.use(flash());
app.use(
  expressSession({
    secret: process.env.secret || "keyboard cat",
    saveUninitialized: false,
    resave: false
  })
);

// Set up express-handlebars
const exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");


// require Passport and the Local Strategy
const passport = require("passport");
app.use(passport.initialize());
app.use(passport.session());

// User and Mongoose code

const User = require("./models/User");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/passport-assignment");

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// facebook
const FacebookStrategy = require("passport-facebook").Strategy;

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    function(accessToken, refreshToken, profile, done) {
      const facebookId = profile.id;
      const displayName = profile.displayName;

      console.log(profile);
      User.findOne({ facebookId }, function(err, user) {
        if (err) return done(err);

        if (!user) {
          // Create a new account if one doesn't exist
          user = new User({ facebookId, displayName });
          user.save((err, user) => {
            if (err) return done(err);
            done(null, user);
          });
        } else {
          // Otherwise, return the extant user.
          done(null, user);
        }
      });
    }
  )
);

app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/",
    failureRedirect: "/login"
  })
);

app.get("/", (req, res) => {
  if (req.user) {
    res.render("home", { user: req.user });
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", function(req, res) {
  req.logout();
  res.redirect("/");
});

app.listen(3000);



