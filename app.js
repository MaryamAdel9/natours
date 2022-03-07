const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

// start express app

// create a variable called app (it's kind of standard) and assign it to the result of calling express
// express is a function which add a bunch of methods to our app variable
const app = express();

// ================================================================================================
//                                 1) Middlewares
// ================================================================================================

// Set security http headers
app.use(helmet());

// Log the information about the request that we did only if we are in development.
// dev is an argument that specify how the logging will look like
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit the amount of requests per IP we are going to allow in a certain amount of time
const limiter = rateLimit({
  // allow 100 requests only from the same IP in one hour
  max: 100,
  windowMs: 60 * 60 * 1000,
  // error message
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// In this middleware the data from the body is added to the request (req.body becomes available)
// body parser, limit the amount of data that comes in the body to 10kb
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// clean our data after parsing it:
// Data sanitization against NoSQL query injection
// this middleware look at the request body, the req query string, and also at request.params
// and filter out all of the dollar signs and dots
app.use(mongoSanitize());

// Data sanitization against XSS attacks
// basically clean any user input from malicious HTML.
// imagine an attacker tries to insert some malicious HTML code with some JavaScript code attached to it
app.use(xss());

// Prevent parameter pollution
// for ex: 127.0.0.1:4000/api/v1/items?sort=ratingsAverage&sort=price,
// it will remove duplicates and only sort by sort=price
// but in this way if we used this url:127.0.0.1:4000/api/v1/items?price=700&price=1000
// it will only show price=1000 and we want both price=700&price=1000,
//  so we should make a whitelist to allow the price to duplicate

app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Serve static files in public folder(ex: home.html)
app.use(express.static(`${__dirname}/public`));

// Add the current time to the request by defining a property requestTime on the request,
// toISOString is a date function that converts it to a readable string
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// ================================================================================================
//                                 2) Routes
// ================================================================================================

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// =========================================================================================
//                                 3) Error handling middlewares
// =========================================================================================

// Handling unhandled routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handling middleware
app.use(globalErrorHandler);

module.exports = app;
