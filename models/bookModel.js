const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book must have a title'],
      unique: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: [true, 'Book must have an author'],
    },
    publishedYear: Number,
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Book must have a category'],
      },
    ],
    price: {
      type: Number,
      required: [true, 'Book must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'The priceDiscount ({VALUE}) can not be higher than price',
      },
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    ratingAverage: {
      type: Number,
      default: 4,
      min: [1, 'rating must be form 1.0-5.0'],
      max: [5, 'rating must be from 1.0-5.0'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    coverImage: {
      type: String,
      required: [true, 'Book Must have a cover'],
      default: '/images/One_Hundred_Years_of_Solitude.jpg',
    },
    description: {
      type: String,
      trim: true,
    },
    slug: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);
// can't use it in qurey because it's not in the database
bookSchema.virtual('priceInEGP').get(function () {
  return this.price * 50;
});

bookSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'book',
  localField: '_id',
});

// run before save() and create docs
bookSchema.pre('save', function (next) {
  this.slug = slugify(this.title, { lower: true });
  next();
});

bookSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'author',
    select: 'name bio -_id',
  }).populate({
    path: 'category',
    select: 'name -_id',
  });

  next();
});

// QUERY MIDDLEWARE
// bookSchema.pre(/^find/, function (next) {
//   this.find({ isAvailable: { $ne: false } });
//   next();
// });

bookSchema.index({ price: 1, ratingAverage: -1 });
bookSchema.index({ category: 1 });
bookSchema.index({ author: 1 });
bookSchema.index({ slug: 1 }, { unique: true });

const Book = mongoose.model('Book', bookSchema);

module.exports = Book;
