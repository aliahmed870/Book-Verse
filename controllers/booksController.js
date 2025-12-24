const Book = require('../models/bookModel');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

const aliasCheapBooks = (req, res, next) => {
  // req.query dose not accept to be modified
  req.aliasOptions = {
    limit: '5',
    sort: 'price',
    fields: 'title,price,summary,difficulty',
  };

  next();
};
const getAllBooks = catchAsync(async (req, res, next) => {
  const finalQuery = { ...req.query, ...req.aliasOptions };

  const feature = new APIFeatures(Book.find(), finalQuery)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  // const books = await feature.query.explain();
  const books = await feature.query;

  return res.status(200).json({
    resulst: books.length,
    status: 'success',
    data: books,
  });
});

const getBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id).populate({
    path: 'reviews',
    select: 'review rating createdAt',
  });

  if (!book) {
    return next(new AppError('No book found with this id', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: book,
  });
});

const getBookBySlug = catchAsync(async (req, res, next) => {
  const book = await Book.findOne({ slug: req.params.slug });
  if (!book) {
    return next(new AppError('No book found with this name', 404));
  }

  return res.status(200).json({
    status: 'success',
    data: book,
  });
});

const postBook = catchAsync(async (req, res, next) => {
  const newBook = await Book.create(req.body);

  res.status(201).json({
    data: newBook,
  });
});

const updateBook = catchAsync(async (req, res, next) => {
  const newBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!newBook) {
    return next(new AppError('No book found with this ID', 404));
  }
  return res.status(200).json({
    status: 'success',
    data: newBook,
  });
});

const deleteBook = catchAsync(async (req, res, next) => {
  const result = await Book.findByIdAndDelete(req.params.id);
  if (!result) {
    return next(new AppError('No book found with this ID', 404));
  }
  return res.status(204).json({
    msg: 'Document deleted successfuly',
  });
});

const getBookStats = catchAsync(async (req, res, next) => {
  const stats = await Book.aggregate([
    {
      $match: { price: { $gte: 10 } },
    },
    {
      $group: {
        _id: { $toUpper: '$author' },
        numBooks: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { numBooks: -1 },
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: stats,
  });
});
module.exports = {
  getAllBooks,
  getBook,
  getBookBySlug,
  postBook,
  updateBook,
  deleteBook,
  aliasCheapBooks,
  getBookStats,
};
