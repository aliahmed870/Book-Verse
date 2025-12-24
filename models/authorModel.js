const mongoose = require('mongoose');

const authorSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    bio: {
      type: String,
      required: true,
      trim: true,
    },
    photo: {
      type: String,
      default: 'defualt-photo',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

authorSchema.virtual('books', {
  ref: 'Book',
  foreignField: 'author',
  localField: '_id',
});

const Author = mongoose.model('Author', authorSchema);

module.exports = Author;
