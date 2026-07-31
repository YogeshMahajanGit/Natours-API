const express = require("express");
const reviewController = require("../controllers/reviewController");
const authController = require("../controllers/authController");

const router = express.Router({ mergeParams: true });

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Tour reviews and ratings. Also accessible nested under /tours/{tourId}/reviews
 */

router.use(authController.protect);

/**
 * @swagger
 * /reviews:
 *   get:
 *     summary: Get all reviews (or all reviews for a specific tour if nested)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of reviews
 *   post:
 *     summary: Create a review for a tour (user role only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - review
 *               - rating
 *             properties:
 *               review:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Review created successfully
 *       403:
 *         description: Not authorized (user role only)
 */
router
  .route("/")
  .get(reviewController.getAllReview)
  .post(
    authController.restrictTo("user"),
    reviewController.setTourUserIds,
    reviewController.createReview,
  );

/**
 * @swagger
 * /reviews/{id}:
 *   get:
 *     summary: Get a single review by ID
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review data
 *       404:
 *         description: No review found with that ID
 *   patch:
 *     summary: Update a review (owner user or admin only)
 *     tags: [Reviews]
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
 *             type: object
 *             properties:
 *               review:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       403:
 *         description: Not authorized (user or admin only)
 *       404:
 *         description: No review found with that ID
 *   delete:
 *     summary: Delete a review (owner user or admin only)
 *     tags: [Reviews]
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
 *         description: Review deleted successfully
 *       403:
 *         description: Not authorized (user or admin only)
 *       404:
 *         description: No review found with that ID
 */
router
  .route("/:id")
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo("user", "admin"),
    reviewController.updateReview,
  )
  .delete(
    authController.restrictTo("user", "admin"),
    reviewController.deleteReview,
  );

module.exports = router;
