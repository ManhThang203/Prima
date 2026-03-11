const express = require("express");

const authController = require("@/controllers/auth.controller");
const authRequired = require("@/middlewares/authRequired");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/verify-email", authController.verifyEmail);
router.get("/me", authRequired, authController.getCurrentUser);

module.exports = router;
