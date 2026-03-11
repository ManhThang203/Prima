const authService = require("@/services/auth.service");
const emailService = require("@/services/email.service");
const queueService = require("@/services/queue.service");
const jwt = require("jsonwebtoken");
const { httpCodes } = require("@/config/constants");

const register = async (req, res) => {
  const { email, password } = req.body;
  const userTokens = await authService.handleRegister(
    email,
    password,
    req.get("user-agent")
  );

  // Tạo token xác thực email (hết hạn sau 1 ngày)
  const verifyToken = jwt.sign(
    { sub: userTokens.user.id },
    process.env.VERIFY_EMAIL_JWT_SECRET,
    { expiresIn: "1d" }
  );

  // Đẩy job vào queue để gửi email xác thực
  try {
    await queueService.push({
      type: "sendVerificationEmail",
      payload: {
        user: userTokens.user,
        verifyToken: verifyToken,
      },
    });
  } catch (error) {
    console.error("Failed to queue verification email:", error);
  }

  res.success(userTokens);
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const userAgent = req.headers["user-agent"];
  const [error, userTokens] = await authService.handleLogin(email, password, userAgent);
  if (error) return res.unauthorized();

  res.success(userTokens);
};

const refreshToken = async (req, res) => {
  const [error, data] = await authService.handleRefreshToken(
    req.body.refreshToken,
    req.get("user-agent")
  );

  if (error) return res.unauthorized();

  res.success(data);
};

const getCurrentUser = async (req, res) => {
  res.success(req.auth.user);
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.badRequest("Token is required");
    }

    // Xác thực Email qua service
    const [error, user] = await authService.handleVerifyEmail(token);

    // Nếu có lỗi (token hết hạn, sai token, hoặc user đã được xác thực)
    if (error) {
      return res.badRequest(error.message || "Invalid token or email already verified");
    }

    // Xác thực email thành công
    return res.success({
      message: "Email verified successfully",
      user,
    });
  } catch (error) {
    console.error("Verify email error:", error);
    return res.error(error.message);
  }
}

module.exports = { register, login, refreshToken, getCurrentUser, verifyEmail };