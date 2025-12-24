const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');

const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmial = require('../utils/email');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  user.password = undefined;
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); any one can create himsilf as adimn
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
  });

  // const token =  jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
  //   expiresIn: process.env.JWT_EXPIRES_IN,
  // });
  if (!newUser) {
    return next(new AppError('Please enter a valid data!', 400));
  }
  createSendToken(newUser, 201, res);
  // const token = signToken(newUser._id);
  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: newUser,
  // });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('please enter your email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Email or password is incorrect', 401));
  }
  createSendToken(user, 200, res);
});
exports.protect = catchAsync(async (req, res, next) => {
  // Check for Token: Verify if the token exists in the request headers (Authorization).

  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return next(new AppError('You are not logged in please log in'));
  }

  // Verify Token: Validate the token's signature and ensure it hasn't expired.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check User Existence: Confirm that the user belonging to this token still exists in the database.
  const existUser = await User.findById(decoded.id);
  if (!existUser) {
    return next(
      new AppError('The user who has this token no longer exist.', 401),
    );
  }

  // Check Password Change: Ensure the user did not change their password after the token was issued

  if (existUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password, please log in again', 401),
    );
  }

  req.user = existUser;
  next();
});

exports.restrictTo = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(
        new AppError(`You don't have permission to do this action`, 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // get the user from POST email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }
  // generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // send token to the user email

  const resetULR = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`;
  const message = `Forgot your password? Submit a PATCH request with your new password and confirmPassword to: ${resetULR}.\nIf you didn't please ignore this email`;

  try {
    await sendEmial({
      email: user.email,
      subject: 'Your password reset token vakid for (10) min',
      message,
    });
    res.status(200).json({
      status: 'success',
      msg: 'Token sent to email',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending email try again later!', 500),
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get the user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // If the token has not expired, and there is a user, set a new password
  if (!user) {
    return next(new AppError('Token has invalid or expired', 400));
  }
  // Update changedPasswordAt property for the user
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetExpires = undefined;
  user.passwordResetToken = undefined;
  await user.save();
  //log the user in
  createSendToken(user, 200, res);
});
exports.updatePassword = catchAsync(async (req, res, next) => {
  // - get the user form the collection
  const user = await User.findById(req.user.id).select('+password');

  // - check if the POSTed password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }
  // - If so, updata the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  // - Log the user in

  createSendToken(user, 200, res);
});

exports.logoutAll = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  user.passwordChangedAt = Date.now() - 1000;
  await user.save({ validateBeforeSave: false });

  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    status: 'success',
    message: 'Logged out from all devices successfully',
  });
});
