const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

const AppError = require("./utils/appError.js");
const globelErrorHandler = require("./utils/errors.js");
const tourRouter = require("./routes/tourRouter.js");
const userRouter = require("./routes/userRouter.js");
const reviewRouter = require("./routes/reviewRouter.js");

const app = express();

// Globel Middlewares

// Security http headers
app.use(helmet());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many request with this IP, Please try again in hour!",
});
app.use("/api", limiter);

// Body parser
app.use(express.json({ limit: "10kb" }));

// Data saninitization (NoSQL query injection & XSS)
app.use(mongoSanitize());
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "maxGroupSize",
      "ratingsAverage",
      "ratingsQuantity",
      "difficulty",
      "price",
    ],
  })
);

// Serving static file
app.use(express.static(`${__dirname}/public`));

// Routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

// Handle not fount (404) requests
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find route ${req.originalUrl} on the server!`, 404));
});

// Globel error handler
app.use(globelErrorHandler);

module.exports = app;
