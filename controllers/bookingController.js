const crypto = require("crypto");
const razorpayInstance = require("../config/razorpay");
const Tour = require("../models/tourModel");
const Booking = require("../models/bookingModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handleFactory");

// Create a Razorpay order for a given tour
exports.checkoutSession = catchAsync(async (req, res, next) => {
  //get tour
  const tour = await Tour.findById(req.params.tourId);
  if (!tour) return next(new AppError("No tour found with that ID", 404));

  const options = {
    amount: tour.price * 100,
    currency: "INR",
    receipt: `rcpt_${tour.id.slice(-8)}_${Date.now()}`,
    notes: {
      tourId: tour.id,
      userId: req.user.id,
    },
  };

  const order = await razorpayInstance.orders.create(options);

  res.status(200).json({
    status: "success",
    order,
    key_id: process.env.RAZORPAY_KEY_ID,
    tour: {
      id: tour.id,
      name: tour.name,
      price: tour.price,
    },
  });
});

// Verify payment signature
exports.verifyPaymentAndBook = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, tourId } =
    req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError("Missing payment verification fields", 400));
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return next(new AppError("Payment verification failed", 400));
  }

  // Idempotency check — has this payment already been booked.
  const existingBooking = await Booking.findOne({
    razorpayPaymentId: razorpay_payment_id,
  });

  if (existingBooking) {
    return res.status(200).json({
      status: "success",
      message: "Booking already exists for this payment",
      data: { booking: existingBooking },
    });
  }

  const tour = await Tour.findById(tourId);
  if (!tour) return next(new AppError("No tour found with that ID", 404));

  try {
    const booking = await Booking.create({
      tour: tour.id,
      user: req.user.id,
      price: tour.price,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      paid: true,
    });

    return res.status(201).json({
      status: "success",
      data: { booking },
    });
  } catch (err) {
    if (err.code === 11000) {
      const existing = await Booking.findOne({
        razorpayPaymentId: razorpay_payment_id,
      });
      return res.status(200).json({
        status: "success",
        message: "Booking already exists for this payment",
        data: { booking: existing },
      });
    }
    return next(err);
  }
});

exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);

// Get bookings for the currently logged in user
exports.getMyBookings = catchAsync(async (req, res, next) => {
  const bookings = await Booking.find({ user: req.user.id });
  res.status(200).json({
    status: "success",
    results: bookings.length,
    data: { bookings },
  });
});
