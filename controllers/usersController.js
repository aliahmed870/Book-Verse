const multer = require('multer');
const sharp = require('sharp');

const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/userModel');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Please upload images only', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({
      quality: 90,
    })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObject = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.getMe = async (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No User found!', 404));
  }

  res.status(200).json({
    status: 'success',
    data: user,
  });
});
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find();
  res.status(200).json({
    result: users.length,
    status: 'success',
    data: users,
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);

  // create err if user post pass & passConfirm in req.body
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('Use /update-my-password for this action', 400));
  }

  const filteredBody = filterObject(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }
  // const { name, email } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    filteredBody,
    // { name, email },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: 'success',
    data: updatedUser,
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.updateUserByAdmin = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.confirmPassword) {
    return next(new AppError('Cannot update password through this route', 400));
  }
  const newUser = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!newUser) {
    return next(new AppError('No User found with this ID', 404));
  }
  return res.status(200).json({
    status: 'success',
    data: newUser,
  });
});

exports.deleteUserByAdmin = catchAsync(async (req, res, next) => {
  const result = await User.findByIdAndDelete(req.params.id);
  if (!result) {
    return next(new AppError('No User found with this ID', 404));
  }
  return res.status(204).json({
    data: null,
  });
});
