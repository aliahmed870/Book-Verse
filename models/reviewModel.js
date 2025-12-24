const mongoose = require('mongoose');

const Book = require('./bookModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Please tell us about your thought'],
      trim: true,
    },
    rating: {
      type: Number,
      required: [true, 'please rate this from 1-5'],
      min: 1,
      max: 5,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Review must belong to a book'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // Added this because reviews didn't appear in book Schema with the virtuals options
    strictPopulate: false, // ← الحل
  },
);

reviewSchema.index(
  { book: 1, user: 1 },
  {
    unique: true,
  },
);

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //     path: 'user',
  //     select: 'name photo -_id',
  //   });
  //   // removed the book populate to avoid the nested populate
  //   // .populate({
  //   //   path: 'book',
  //   //   select: 'title',
  //   // });

  next();
});

reviewSchema.statics.calcAverageRating = async function (bookId) {
  const stats = await this.aggregate([
    {
      $match: { book: bookId },
    },
    {
      $group: {
        _id: '$book',
        nRating: { $sum: 1 },
        rAverage: { $avg: '$rating' },
      },
    },
  ]);
  console.log(stats);

  if (stats.length > 0) {
    await Book.findByIdAndUpdate(bookId, {
      ratingAverage: stats[0].rAverage,
      ratingQuantity: stats[0].nRating,
    });
  } else {
    await Book.findByIdAndUpdate(bookId, {
      ratingAverage: 4,
      ratingQuantity: 0,
    });
  }
};

reviewSchema.post('save', function () {
  this.constructor.calcAverageRating(this.book);
});

// mongoose 6
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.model.findOne(this.getQuery());
  next();
});

reviewSchema.post(/^findOneAnd/, async function () {
  if (this.r) {
    await this.r.constructor.calcAverageRating(this.r.book);
  }
});
const Review = mongoose.model('Review', reviewSchema, 'reviews');

module.exports = Review;
