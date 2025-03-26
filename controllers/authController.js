const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const sendEmail = require("../utils/email");

// generate a jwt token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: true,
    httpOnly: true,
  };

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, password, passwordConfirm, role } = req.body;

  // signup the user
  const newUser = await User.create({
    name,
    email,
    password,
    passwordConfirm,
    role,
  });

  // create a jwt token & send
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError("Please provide a email & password!", 400));
  }

  // check if user exits & password correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // Send response with jwt token
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { passwordCurrent, passwordConfirm } = req.body;

  // Get the user
  const user = await User.findById(req.user.id).select("+password");

  if (!user) return next(new AppError("User not found!"));

  // check prev password
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError("Incorrect password", 401));
  }

  // update new passwoed
  user.password = passwordCurrent;
  user.passwordConfirm = passwordConfirm;
  await user.save();

  // Log user with JWt
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // Get token
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new AppError("Please login to get access.", 401));
  }

  //Verification token
  // promisify :- callback-based methods to promise-based
  const decode = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  ).catch((err) => next(new AppError(err.message, 401)));

  // Check if user exits
  const currentUser = await User.findById(decode.id);
  if (!currentUser)
    return next(
      new AppError("The user belonging to this token does no longer exits", 401)
    );

  // Check user change password after the token issued
  if (!currentUser.changePasswordAfter(decode.iat))
    next(new AppError("Please login again!", 401));

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You dont have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError("Enter a email", 404));
  }

  // Find user base on email
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("User not exist with this email address", 404));
  }
  // Generate random token
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //Send it to user email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/reset-password/${resetToken}`;

  const message = `Forgot Your Password? Click on url to reset your password ${resetURL} .\n\n If you didnt forgat your password, please ignore this `;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token send to email",
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(error);

    return next(
      new AppError("There was an error ending to email. Try again later!", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user base on token & token expire or not
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) return next(new AppError("Token is invalid or expires", 400));

  // set new password in DB & reset token value
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // Log user with JWT token
  createSendToken(user, 200, res);
});
