const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: "./.env" });

module.exports = async function connectDB() {
  try {
    mongoose.connection.on("connected", () => {
      console.log("Connected to database successfully 💹");
    });

    mongoose.connection.on("error", (error) => {
      console.error(
        "Error in connecting to database 💥",
        error.name,
        "---",
        error.message
      );
    });

    await mongoose.connect(process.env.DATABASE_CONNECT_URL);
  } catch (error) {
    console.error("Faild to connect database..", error.message);
    process.exit(1);
  }
};
