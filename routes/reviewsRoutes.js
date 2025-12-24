const express = require('express');

const reviewController = require('../controllers/reviewsController');
const authController = require('../controllers/authController');

const router = express.Router({ mergeParams: true });

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview,
  );

router
  .route('/:id')
  .patch(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.updateReview,
  )
  .delete(authController.protect, reviewController.deleteReview);

module.exports = router;
