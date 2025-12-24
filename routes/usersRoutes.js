const express = require('express');
const rateLimit = require('express-rate-limit'); // ADDED

const usersController = require('../controllers/usersController');
const authController = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  max: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (No Authentication Required)
router.post('/signup', authLimiter, authController.signup);
router.post('/login', authLimiter, authController.login);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// PROTECTED ROUTES (Authentication Required)

router.use(authController.protect);

router.post('/logout', authController.logoutAll);
router.patch('/update-my-password', authController.updatePassword);
router.get('/me', usersController.getMe, usersController.getUser);

router.patch(
  '/updateMe',
  usersController.uploadUserPhoto,
  usersController.resizeUserPhoto,
  usersController.updateMe,
);
router.delete('/deleteMe', usersController.deleteMe);

// ADMIN ONLY ROUTES

router.use(authController.restrictTo('admin'));

router.route('/').get(usersController.getAllUsers);

router
  .route('/:id')
  .get(usersController.getUser)
  .patch(usersController.updateUserByAdmin)
  .delete(usersController.deleteUserByAdmin);

module.exports = router;
