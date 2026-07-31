const AppError = require("./../utils/appError");

const sendErrorDevelopment = (err, res) => {
  res.status(err.statusCode).json({
    err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProduction = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

const handleCastErrorDB = (err) => {
  const msg = `Invalid ${err.path}: ${err.value}`;
  return new AppError(msg, 400);
};

// DB error handle
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue ? Object.values(err.keyValue)[0] : "field";
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

module.exports = (err, req, res, next) => {
  let error = { ...err, message: err.message, name: err.name };

  if (error.name === "ValidationError") error = handleValidationErrorDB(error);
  if (error.code === 11000) error = handleDuplicateFieldsDB(error);

  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  if (process.env.NODE_ENV === "production") {
    sendErrorProduction(error, res);
  } else {
    sendErrorDevelopment(error, res);
  }
};
