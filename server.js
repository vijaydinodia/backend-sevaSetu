const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const app = express();
app.use(express.json());
app.use(cors());

// Nodemon restart trigger

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB is connected");
  })
  .catch((err) => console.log("Db is not connected ,", err));

const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");
const superAdminRoute = require("./routes/superAdminRoute");
const adminRoute = require("./routes/adminRoute");
const providerRoute = require("./routes/providerRoute");
const locationRoute = require("./routes/locationRoute");
const firebaseAuthRoute = require("./routes/firebaseAuthRoute");

app.use("/user", authRoute);
app.use("/user", userRoute);
app.use("/superadmin", superAdminRoute);
app.use("/admin", adminRoute);
app.use("/provider", providerRoute);
app.use("/location", locationRoute);
app.use("/auth", firebaseAuthRoute);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(process.env.PORT, () => {
  console.log("server is running on port", process.env.PORT);
});
