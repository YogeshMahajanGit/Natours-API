const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const cors = require("cors");

const AppError = require("./utils/appError.js");
const globelErrorHandler = require("./utils/errors.js");
const bookingController = require("./controllers/bookingController.js");
const tourRouter = require("./routes/tourRouter.js");
const userRouter = require("./routes/userRouter.js");
const bookingRouter = require("./routes/bookingRouter.js");
const reviewRouter = require("./routes/reviewRouter.js");

const app = express();

// Globel Middlewares

// Security http headers
app.use(helmet());

// cors
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  }),
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 10 * 60 * 1000, // 10 minutes
  message: "Too many requests from this IP, please try again in 10 minutes!",
});

app.use("/api", limiter);

// Razorpay signs
app.post(
  "/api/v1/webhook-razorpay",
  express.raw({ type: "application/json" }),
  bookingController.razorpayWebhook,
);

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
  }),
);

// Serving static file
app.use(express.static(`${__dirname}/public`));

// Swagger doc
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Monitoring route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});
app.get("/", (req, res) => {
  res.status(200).json({
    status: "online",
  });
});

// Routes
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/booking", bookingRouter);

// Handle not fount (404) requests
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find route ${req.originalUrl} on the server!`, 404));
});

// Globel error handler
app.use(globelErrorHandler);

module.exports = app;
