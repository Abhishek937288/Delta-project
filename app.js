// Load environment variables only in development
if (process.env.NODE_ENV !== "production") {
  require('dotenv').config();
}

const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsmate = require("ejs-mate");
const ExpressError = require('./utils/ExpressError');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const { isLoggedIn } = require("./middleware");

// Importing routers
const listingRouter = require("./routes/listing");
const reviewRouter = require("./routes/review");
const userRouter = require("./routes/user");

// Setting up MongoDB URL
const dbUrl = process.env.ATLASDB_URL || "mongodb://localhost:27017/localDB";

// Database connection function
async function main() {
  await mongoose.connect(dbUrl);
}

main()
  .then(() => console.log("Connected to DB"))
  .catch((err) => console.error("Database connection error:", err));

// Create Express app
const app = express();

// Configure view engine and views path
const viewsPath = path.join(__dirname, 'views');
console.log("Views path:", viewsPath);  // Add this log for debugging
console.log("Files in views directory:", require('fs').readdirSync(viewsPath));  // Log files in views directory
app.engine("ejs", ejsmate);
app.set("view engine", "ejs");
app.set('views', viewsPath);

// Configure static file serving
app.use(express.static(path.join(__dirname, "public")));

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(flash());

// Session setup with MongoDB store
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: process.env.SECRET || 'fallbacksecret' },
  touchAfter: 24 * 3600, // Update session every 24 hours
});
store.on("error", (err) => console.error("Session store error:", err));

const sessionOptions = {
  store,
  secret: process.env.SECRET || "fallbacksecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
  },
};

app.use(session(sessionOptions));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Flash messages and user data middleware
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// Routes
app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// 404 handler for unknown routes
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

// Custom error handling
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error", { message });
});

// Server setup
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
