if(process.env.NODE_ENV != "production"){
  require('dotenv').config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsmate = require("ejs-mate");
const ExpressError = require('./utils/ExpressError.js');
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const {isLoggedIn} = require("./middleware.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js"); 
const { error } = require('console');

const dbUrl = process.env.ATLASDB_URL
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set('view engine', 'ejs');
app.set("views", path.resolve(__dirname, "./views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.engine("ejs", ejsmate); 

const store = MongoStore.create({
  mongoUrl :dbUrl,
  crypto : {
   secret : process.env.SECRET,
  }, 
  touchAfter : 24 * 3600, 
 });

 store.on("error",()=>{
  console.log("EROOR IN MONGO SESSION STORE",error);
 });

const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
  },
};

// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req,res,next)=>{
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user;
  next();
});


// app.get("/demouser",async(req,res)=>{
//   let fakeUser = new User ({
//     email : "student@gmail.com",
//     username : "delta-student"
//   });

//   let registerUser = await User.register(fakeUser,"helloworld");
//   res.send(registerUser);
// });

const validateReview = (req,res,next)=>{
  const { error } = reviewSchema.validate(req.body);
  
  if (error) {
    let errMsg = error.details.map((el)=>el.message).join(",");
    throw new ExpressError(400, errMsg); 
  }else{
    next();
  }
};


app.use("/listings",listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);


app.all("*",(req,res,next)=>{
  next(new ExpressError(404,"page not found"));
});

app.use((err,req,res,next)=>{
  let{statusCode = 500 ,message="Something went Wrong!" }= err;
  res.status(statusCode).render("error.ejs", { message });
  //  res.status(statusCode).send(message);
}); 



app.listen(8080, () => {
  console.log("server is listening to port 8080");
});