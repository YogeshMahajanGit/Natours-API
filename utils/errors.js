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

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDevelopment(err, res);
  } else if (process.env.NODE_ENV === "production") {
    // let error = { ...err };
    // if (error.name === "CastError") error = handleCastErrorDB(error);
    sendErrorProduction(err, res);
  }
};
