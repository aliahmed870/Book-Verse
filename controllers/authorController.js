const Author = require('../models/authorModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllAuthor = catchAsync(async (req, res, next) => {
  const authors = await Author.find();

  res.status(200).json({
    result: authors.length,
    status: 'success',
    data: authors,
  });
});

exports.getAuthor = catchAsync(async (req, res, next) => {
  const author = await Author.findById(req.params.id).populate({
    path: 'books',
    select: 'title price ratingAverage slug',
  });
  if (!author) {
    return next(new AppError('No author found in data base', 404));
  }
  res.status(200).json({
    status: 'success',
    data: author,
  });
});

exports.createAuthor = catchAsync(async (req, res, next) => {
  const author = await Author.create(req.body);
  if (!author) {
    return next(new AppError('Please enter the author', 400));
  }
  res.status(201).json({
    status: 'success',
    data: author,
  });
});

exports.updateAuthor = catchAsync(async (req, res, next) => {
  const author = await Author.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!author) {
    return next(new AppError('No author found with this ID', 404));
  }
  return res.status(200).json({
    status: 'success',
    data: author,
  });
});

exports.deleteAuthor = catchAsync(async (req, res, next) => {
  const result = await Author.findByIdAndDelete(req.params.id);
  if (!result) {
    return next(new AppError('No Author found with this ID', 404));
  }
  return res.status(204).json({
    data: null,
  });
});
