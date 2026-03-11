require("module-alias/register");

const express = require("express");
const cors = require("cors");

require("dotenv").config();
require("./polyfill");

const customResponse = require("@/middlewares/customResponse");
const errorHandle = require("@/middlewares/errorHandle");
const notFoundHandle = require("@/middlewares/notFoundHandle");
const rootRoute = require("@/routes");
const app = express();
const port = 3000;

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:5173", "https://manththang203.github.io"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
};
// Middleware
app.use(cors(corsOptions));
app.use(customResponse);
app.use(express.json());

// Router
app.use("/api", rootRoute);

// Error handling middleware
app.use(notFoundHandle);
app.use(errorHandle);

app.listen(port, () => {
  console.log(`Demo app listening on port ${port}`);
});
