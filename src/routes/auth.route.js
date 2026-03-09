const express = require("express");

const authController = require("@/controllers/auth.controller");
const authRequired = require("@/middlewares/authRequired");

const router = express.Router();

router.post("/register", authController.register);
router.get("/me", authRequired, authController.getCurrentUser);

module.exports = router;
