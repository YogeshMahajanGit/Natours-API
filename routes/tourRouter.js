const express = require("express");
const tourController = require("../controllers/tourController");
const authController = require("../controllers/authController");
const reviewRouter = require("../routes/reviewRouter");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tours
 *   description: Browse, filter, and manage tours
 */

router.use("/:tourId/reviews", reviewRouter);

/**
 * @swagger
 * /tours/top-5-cheap:
 *   get:
 *     summary: Get the top 5 cheapest, highest-rated tours
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: List of the top 5 tours
 */
router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

/**
 * @swagger
 * /tours/tour-stats:
 *   get:
 *     summary: Get aggregated tour statistics (avg price, rating, count by difficulty)
 *     tags: [Tours]
 *     responses:
 *       200:
 *         description: Aggregated statistics grouped by difficulty
 */
router.route("/tour-stats").get(tourController.getTourStats);

/**
 * @swagger
 * /tours/monthly-plane/{year}:
 *   get:
 *     summary: Get monthly tour plan for a given year (admin/guide only)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *         description: The year to get the tour plan for, e.g. 2026
 *     responses:
 *       200:
 *         description: Number of tours starting per month
 *       403:
 *         description: Not authorized (admin, lead-guide, or guide only)
 */
router
  .route("/monthly-plane/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthlyPlane,
  );

/**
 * @swagger
 * /tours/tours-within/{distance}/center/{latlng}/unit/{unit}:
 *   get:
 *     summary: Get tours within a given radius of a location
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: distance
 *         required: true
 *         schema:
 *           type: number
 *         description: Radius distance
 *       - in: path
 *         name: latlng
 *         required: true
 *         schema:
 *           type: string
 *         description: Latitude,longitude, e.g. 34.111745,-118.113491
 *       - in: path
 *         name: unit
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mi, km]
 *     responses:
 *       200:
 *         description: List of tours within the given radius
 *       400:
 *         description: Missing or invalid latlng format
 */
router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(tourController.getTourWithin);

/**
 * @swagger
 * /tours/distances/{latlng}/unit/{unit}:
 *   get:
 *     summary: Get distances from a point to all tours
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: latlng
 *         required: true
 *         schema:
 *           type: string
 *         description: Latitude,longitude, e.g. 34.111745,-118.113491
 *       - in: path
 *         name: unit
 *         required: true
 *         schema:
 *           type: string
 *           enum: [mi, km]
 *     responses:
 *       200:
 *         description: Distances from the given point to each tour
 */
router.route("/distances/:latlng/unit/:unit").get(tourController.getDistances);

/**
 * @swagger
 * /tours:
 *   get:
 *     summary: Get all tours (supports filtering, sorting, pagination)
 *     tags: [Tours]
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: e.g. price,-ratingsAverage
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of tours
 *   post:
 *     summary: Create a new tour (admin/lead-guide only)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tour'
 *     responses:
 *       201:
 *         description: Tour created successfully
 *       403:
 *         description: Not authorized (admin or lead-guide only)
 */
router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour,
  );

/**
 * @swagger
 * /tours/{id}:
 *   get:
 *     summary: Get a single tour by ID
 *     tags: [Tours]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tour data
 *       404:
 *         description: No tour found with that ID
 *   patch:
 *     summary: Update a tour by ID (admin/lead-guide only)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Tour'
 *     responses:
 *       200:
 *         description: Tour updated successfully
 *       403:
 *         description: Not authorized (admin or lead-guide only)
 *       404:
 *         description: No tour found with that ID
 *   delete:
 *     summary: Delete a tour by ID (admin/lead-guide only)
 *     tags: [Tours]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Tour deleted successfully
 *       403:
 *         description: Not authorized (admin or lead-guide only)
 *       404:
 *         description: No tour found with that ID
 */
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour,
  );

module.exports = router;
