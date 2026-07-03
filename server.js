const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(helmet());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
  },
});
app.use(globalLimiter);


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again after 15 minutes.",
  },
});

app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("DB is connected");
    // Drop the old unique phone index to prevent duplicate null key errors
    mongoose.connection.db.collection("users").dropIndex("phone_1").catch((err) => {

    });
  })
  .catch((err) => console.log("Db is not connected ,", err));

const userRoute = require("./routes/userRoute");
const authRoute = require("./routes/authRoute");
const superAdminRoute = require("./routes/superAdminRoute");
const adminRoute = require("./routes/adminRoute");
const providerRoute = require("./routes/providerRoute");
const locationRoute = require("./routes/locationRoute");
const firebaseAuthRoute = require("./routes/firebaseAuthRoute");
const githubAuthRoute = require("./routes/githubAuthRoute");

app.use("/user", authLimiter, authRoute);
app.use("/user", userRoute);
app.use("/superadmin", superAdminRoute);
app.use("/admin", adminRoute);
app.use("/provider", providerRoute);
app.use("/location", locationRoute);
app.use("/auth", authLimiter, firebaseAuthRoute);
app.use("/auth", authLimiter, githubAuthRoute);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.listen(process.env.PORT, () => {
  console.log("server is running on port", process.env.PORT);
});
