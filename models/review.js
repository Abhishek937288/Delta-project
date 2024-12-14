const mongoose = require("mongoose");
const { Schema } = mongoose;

const reviewSchema = new Schema({
    comment: {
        type: String, 
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now, 
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"  // This should reference the "User" model
      }
});

module.exports = mongoose.model("Review", reviewSchema);
