const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'please Enter your name'],
      trim: true,
    },
    photo: {
      type: String,
      default: 'default_pfp.jpg',
    },
    email: {
      type: String,
      required: [true, 'You must have an email'],
      unique: true,
      trim: true,
      lowercase: true,
      validate: [validator.isEmail, 'Invalid email'],
    },
    password: {
      type: String,
      trim: true,
      required: [true, 'You must have a password'],
      minlength: 8,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      default: undefined,
    },
    confirmPassword: {
      type: String,
      trim: true,
      required: [true, 'You must confirm your password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'please enter the same password',
      },
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema.pre('save', async function (next) {
  // This function run only if password is modified (created | updated)
  // if stat means if the pass is not cearted or uptade go to the next MW
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete it before save the doc in database
  this.confirmPassword = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimesTamp) {
  if (this.passwordChangedAt) {
    // it will be like a date 2025-11-23, so we need to make it in second
    const timeInS = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimesTamp < timeInS;
  }

  // this means the password was not changed so the if stat in protect will be false
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(64).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 min
  console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;
