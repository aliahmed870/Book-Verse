const Category = require('../models/categoryModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getAllCategory = catchAsync(async (req, res, next) => {
  const categorys = await Category.find();

  res.status(200).json({
    result: categorys.length,
    status: 'success',
    data: categorys,
  });
});

exports.getCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id).populate({
    path: 'books',
    select: 'title price ratingAverage slug',
  });
  if (!category) {
    return next(new AppError('No Catagory found in data base', 404));
  }
  res.status(200).json({
    status: 'success',
    data: category,
  });
});

exports.createCategory = catchAsync(async (req, res, next) => {
  const category = await Category.create(req.body);
  if (!category) {
    return next(new AppError('Please enter the category', 400));
  }
  res.status(201).json({
    status: 'success',
    data: category,
  });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    return next(new AppError('No category found with this ID', 404));
  }
  return res.status(200).json({
    status: 'success',
    data: category,
  });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const result = await Category.findByIdAndDelete(req.params.id);
  if (!result) {
    return next(new AppError('No Category found with this ID', 404));
  }
  return res.status(204).json({
    data: null,
  });
});
