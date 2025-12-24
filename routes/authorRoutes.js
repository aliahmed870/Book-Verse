const express = require('express');
const authorController = require('../controllers/authorController');
const authController = require('../controllers/authController');
const authorRouter = express.Router();

authorRouter
  .route('/')
  .get(authorController.getAllAuthor)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    authorController.createAuthor,
  );
authorRouter
  .route('/:id')
  .get(authorController.getAuthor)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    authorController.updateAuthor,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    authorController.deleteAuthor,
  );

module.exports = authorRouter;
