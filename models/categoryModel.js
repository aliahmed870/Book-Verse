const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// auto slug
categorySchema.pre('save', function (next) {
  if (this.isModified('name')) this.slug = slugify(this.name, { lower: true });
  next();
});

// virtual populate
categorySchema.virtual('books', {
  ref: 'Book',
  foreignField: 'category',
  localField: '_id',
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
