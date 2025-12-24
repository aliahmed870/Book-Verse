const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.bookId) {
    filter = { book: req.params.bookId };
  }

  const reviews = await Review.find(filter);

  res.status(200).json({
    status: 'success',
    result: reviews.length,
    data: {
      reviews,
    },
  });
});

exports.createReview = catchAsync(async (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  if (!req.body.book) req.body.book = req.params.bookId;
  const review = await Review.create(req.body);

  res.status(201).json({
    status: 'success',
    data: review,
  });
});

exports.updateReview = catchAsync(async (req, res, next) => {
  const newReview = await Review.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!newReview) {
    return next(new AppError('No book found with this ID', 404));
  }
  return res.status(200).json({
    status: 'success',
    data: newReview,
  });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
  const result = await Review.findByIdAndDelete(req.params.id);
  if (!result) {
    return next(new AppError('No Review found with this ID', 404));
  }
  return res.status(204).json({
    data: null,
  });
});
