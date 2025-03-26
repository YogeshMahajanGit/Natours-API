const dotenv = require("dotenv");
const app = require("./app");
const connectDB = require("./config/db");

dotenv.config({ path: "./.env" });

// Connect to database
connectDB();

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`⫸ App ∷∷∷ is running on port ${port}🚀 ⫷`);
});

// Handle an un handle rejections
process.on("unhandledRejection", (err) => {
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
