const mongoose = require("mongoose");
const { Schema } = mongoose;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema ({
  email : {
    type: String,
    required : true
  }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);