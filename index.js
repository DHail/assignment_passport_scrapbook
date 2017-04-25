const app = require("express")();
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const flash = require("express-flash");
require('dotenv').config();
const request = require('request');


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
const cleanDb = require('./seeds/clean');

app.use((req, res, next) => {
  if (mongoose.connection.readyState) {
    next();
  }
  else {
    mongoose.connect("mongodb://localhost/passport-assignment")
      .then(() => {
        // cleanDb().then(() => {
          next()
        // })
      });
  }
});



passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// Require and use Facebook Strategy
const facebookStrategy = require("./strategies/facebook");
const githubStrategy = require("./strategies/github");

passport.use(facebookStrategy());
passport.use(githubStrategy);


// Facebook Auth Routes
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: "/",
    failureRedirect: "/login"
  })
);

// Github Auth Routes
app.get("/auth/github", passport.authenticate("github"));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", {
    successRedirect: "/",
    failureRedirect: "/login"
  })
);





var FB = require('fb');


app.get("/", (req, res) => {
  if (req.user) {
    let fbInfo = req.user.getModuleInfo("Facebook");
    let ghInfo = req.user.getModuleInfo("Github");
    let fbPromise;
    let ghPromise;


    if (fbInfo.connected) {
      fbPromise = new Promise( (resolve, reject) => {
        FB.api('me/photos', { fields: 'picture', access_token: fbInfo.token }, function (data) {
          
          resolve(data);
          // res.render("home", { user: req.user, pictures: data.data });
      })
    }

    if(ghInfo.connected) {
      ghPromise = new Promise( (resolve, reject) => {
        request(`https://api.github.com/${ghInfo.username}?access_token=${ghInfo.token}`, function (error, response, body) {
            resolve(body);
        });

        
    }
      
      });
    } else {
      res.render("home", { user: req.user });
    }

  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", function(req, res) {
  req.logout();
  console.log(req.user);
  res.redirect("/");
});

app.listen(3000);



