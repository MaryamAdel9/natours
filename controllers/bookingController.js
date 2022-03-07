const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tourAll = await Tour.findById(req.params.tourId);

  const tour = tourAll._id;
  const user = req.user.id;
  // console.log(tourAll._id);
  // console.log(req.user.id);

  const { price } = tourAll;
  if (!tour && !user && !price) return next();
  await Booking.create({ tour, user, price });

  // 2) Create checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    success_url: `${req.protocol}://${req.get('host')}/my-tours/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tourAll.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tourAll.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        name: `${tourAll.name} Tour`,
        description: tourAll.summary,
        images: [`https://www.natours.dev/img/tours/${tourAll.imageCover}`],
        amount: tourAll.price * 100,
        currency: 'usd',
        quantity: 1
      }
    ]
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session
  });
});

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0]);
// });

// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
//   // const { tour, user, price } = req.query;
//   // console.log(req.query);

//   const Alltour = await Tour.findById(req.params.tourId);
//   console.log(req.params.tourId);
//   const { tour, user, price } = Alltour;

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });

//   // res.redirect(req.originalUrl.split('?')[0]);
// });

exports.getMyTours = catchAsync(async (req, res, next) => {
  // 1) Find all bookings
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs
  const tourIDs = bookings.map(el => el.tour);
  const tours = await Tour.find({ _id: { $in: tourIDs } });

  res.status(200).json({
    status: 'success',
    result: tours.length,
    tours
  });
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
