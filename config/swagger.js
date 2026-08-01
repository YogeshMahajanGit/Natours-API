const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Natours API",
      version: "1.0.0",
      description:
        "REST API for browsing and booking tours, with Razorpay payment integration.",
      contact: {
        name: "Yogesh Mahajan",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api/v1",
        description: "Local development server",
      },
      {
        url: "https://natours-api-906g.onrender.com/api/v1",
        description: "Production",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      schemas: {
        Tour: {
          type: "object",
          properties: {
            name: { type: "string" },
            duration: { type: "number" },
            maxGroupSize: { type: "number" },
            difficulty: {
              type: "string",
              enum: ["easy", "medium", "difficult"],
            },
            ratingsAverage: { type: "number" },
            ratingsQuantity: { type: "number" },
            price: { type: "number" },
            summary: { type: "string" },
            description: { type: "string" },
            imageCover: { type: "string" },
            startDates: {
              type: "array",
              items: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

module.exports = swaggerJsdoc(options);
