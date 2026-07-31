const express = require("express");
const bookingController = require("../controllers/bookingController");
const authController = require("../controllers/authController");

const router = express.Router();

router.use(authController.protect);

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Tour booking and Razorpay payment endpoints
 */

/**
 * @swagger
 * /booking/checkout-session/{tourId}:
 *   get:
 *     summary: Create a Razorpay order for a tour
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tourId
 *         required: true
 *         schema:
 *           type: string
 *         description: The tour's MongoDB ID
 *     responses:
 *       200:
 *         description: Razorpay order created successfully
 *       404:
 *         description: No tour found with that ID
 */
router.get("/checkout-session/:tourId", bookingController.checkoutSession);

/**
 * @swagger
 * /booking/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment signature and create a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *               - tourId
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *               tourId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       200:
 *         description: Booking already exists for this payment (idempotent)
 *       400:
 *         description: Missing fields or invalid signature
 */
router.post("/verify-payment", bookingController.verifyPaymentAndBook);

/**
 * @swagger
 * /booking/my-bookings:
 *   get:
 *     summary: Get all bookings for the currently logged-in user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the user's bookings
 */
router.get("/my-bookings", bookingController.getMyBookings);

// Only for admin
router.use(authController.restrictTo("admin", "lead-guide"));

router
  .route("/")
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route("/:id")
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;
