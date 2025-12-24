const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const hpp = require('hpp');
// const mongoSanitize = require('express-mongo-sanitize');

const xssSanitizerMiddleware = require('./middlewares/xssSanitizer');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorContorller');

const booksRouter = require('./routes/booksRoutes');
const usersRouter = require('./routes/usersRoutes');
const reviewsRouter = require('./routes/reviewsRoutes');
const authorsRouter = require('./routes/authorRoutes');
const categoriesRouter = require('./routes/categoryRoutes');

const app = express();

app.set('query parser', 'extended');

// Serving static files from public folder
app.use(express.static(path.join(__dirname, 'public')));

// <----------------- GLOBAL MIDDLEWARES ----------------->

// Set security HTTP headers
app.use(helmet());
// // Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// // To avoid BRUTE FORCE ATTACK
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);
// // Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// This is used instead of the standard 'express-mongo-sanitize' and 'xss-clean' to avoid conflicts with Express's query parser.
app.use(xssSanitizerMiddleware);
// Prevent paramter polution
app.use(
  hpp({
    whitelist: [
      'publishedYear',
      'price',
      'ratingAverage',
      'ratingQuantity',
      'genres',
    ],
  }),
);
// app.use(xss());

// Test Middleware
// app.use((req, res, next) => {
//   console.log(req.headers);
//   next();
// });

app.use('/api/v1/books', booksRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewsRouter);
app.use('/api/v1/authors', authorsRouter);
app.use('/api/v1/categories', categoriesRouter);

app.all(/(.*)/, (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
