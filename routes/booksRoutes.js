const express = require('express');
const booksController = require('../controllers/booksController');
const authController = require('../controllers/authController');
const reviewsRouter = require('../routes/reviewsRoutes');

const booksRouter = express.Router();

booksRouter.use('/:bookId/reviews', reviewsRouter);

booksRouter
  .route('/cheap')
  .get(booksController.aliasCheapBooks, booksController.getAllBooks);

booksRouter.route('/get-book-stats').get(booksController.getBookStats);

booksRouter
  .route('/')
  // .get(authController.protect, booksController.getAllBooks)
  .get(booksController.getAllBooks)
  .post(
    authController.protect,
    authController.restrictTo('admin'),
    booksController.postBook,
  );

booksRouter.route('/details/:slug').get(booksController.getBookBySlug);

booksRouter
  .route('/:id')
  .get(booksController.getBook)
  .patch(
    authController.protect,
    authController.restrictTo('admin'),
    booksController.updateBook,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin'),
    booksController.deleteBook,
  );

module.exports = booksRouter;
