const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("@/libs/prisma");
const authConfig = require("@/config/auth");
const randomString = require("@/utils/randomString");
const { UAParser } = require("ua-parser-js");


class AuthService {
  /**
   * Đăng ký người dùng mới
   */
  async handleRegister(email, password, userAgent) {
    // Mã hóa mật khẩu trước khi lưu vào database
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
      },
    });

    // Tạo tokens
    const userTokens = await this.generateUserTokens(user, userAgent);
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        isVerified: user.isVerified,
        emailVerifiedAt: user.emailVerifiedAt,
      }, ...userTokens
    };
  }

  /**
   * Đăng nhập người dùng
   */
  async handleLogin(email, password, userAgent) {
    // Tìm user theo email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // User không tồn tại
    if (!user) return [true, null];

    // So sánh mật khẩu
    const isValid = await bcrypt.compare(password, user.password);

    // Đăng nhập thành công -> tạo tokens
    if (isValid) {
      const userTokens = await this.generateUserTokens(user, userAgent);
      return [null, userTokens];
    }

    // Mật khẩu không đúng
    return [true, null];
  }

  /**
   * Làm mới access token bằng refresh token
   */
  async handleRefreshToken(token, userAgent) {
    // Tìm refresh token còn hiệu lực trong database
    const refreshToken = await prisma.refreshToken.findUnique({
      where: {
        token,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Token không hợp lệ hoặc đã hết hạn
    if (!refreshToken) {
      return [true, null];
    }

    // Tạo tokens mới cho user
    const user = { id: refreshToken.userId };
    const userTokens = await this.generateUserTokens(user, userAgent);

    // Vô hiệu hóa refresh token cũ
    await prisma.refreshToken.update({
      where: {
        id: refreshToken.id,
      },
      data: {
        isRevoked: true,
      },
    });

    return [null, userTokens];
  }

  /**
   * Xác thực email người dùng
   * @param {string} token - JWT token từ email xác thực
   * @returns {Promise<[error, user]>} - Trả về [error, user]
   */
  async handleVerifyEmail(token) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.VERIFY_EMAIL_JWT_SECRET, {
        algorithms: ["HS256"],
      });

      // Tìm user theo ID từ token
      const user = await prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      // User không tồn tại
      if (!user) {
        return [new Error("User not found"), null];
      }

      // Email đã được xác thực trước đó
      if (user.emailVerifiedAt) {
        return [new Error("Email already verified"), null];
      }

      // Cập nhật trường emailVerifiedAt trong database
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerifiedAt: new Date(),
          isVerified: true,
        },
      });

      // Trả về user đã được cập nhật (không bao gồm password)
      return [null, {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        isVerified: updatedUser.isVerified,
        emailVerifiedAt: updatedUser.emailVerifiedAt,
      }];
    } catch (error) {
      console.error("Verify email error:", error.message);

      // Token không hợp lệ hoặc hết hạn
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return [new Error("Invalid or expired token"), null];
      }

      return [error, null];
    }
  }

  /**
   * Tạo access token (JWT)
   */
  generateAccessToken(user) {
    // Tính thời hạn token (giây)
    const expiresAt = Math.floor(Date.now() / 1000) + authConfig.accessTokenTTL;
    // Tạo payload chứa user ID và thời hạn
    const tokenPayload = {
      sub: user.id,
      exp: expiresAt,
    };
    // Ký token bằng secret key
    const accessToken = jwt.sign(tokenPayload, authConfig.jwtSecret);
    return accessToken;
  }

  /**
   * Tạo refresh token và lưu vào database
   */
  async generateRefreshToken(user, userAgentString) {
    // Parse User-Agent để lấy thông tin trình duyệt và hệ điều hành
    const parser = new UAParser(userAgentString);
    const browser = parser.getBrowser();
    const os = parser.getOS();

    // Format: "Chrome 120.0.0.0 on Windows 10"
    const browserName = browser.name ? `${browser.name} ${browser.version || ''}`.trim() : 'Unknown Browser';
    const osName = os.name ? `${os.name} ${os.version || ''}`.trim() : 'Unknown OS';
    const userAgent = `${browserName} on ${osName}`;

    // Tạo token ngẫu nhiên, đảm bảo không trùng lặp
    let token, exists = false;
    do {
      token = randomString(32);
      const count = await prisma.refreshToken.count({
        where: { token },
      });
      exists = count > 0;
    } while (exists);

    // Tính thời hạn refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + authConfig.refreshTokenTTL);

    // Lưu refresh token vào database
    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token,
        userAgent,
        expiresAt,
      },
    });

    return refreshToken.token;
  }

  /**
   * Lấy thông tin người dùng theo ID
   */
  async getUserById(id) {
    // Lấy thông tin user (không lấy password)
    const user = await prisma.user.findUnique({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isVerified: true,
        emailVerifiedAt: true,
      },
      where: { id },
    });
    return user;
  }

  /**
   * Tạo cặp token (access + refresh) cho người dùng
   */
  async generateUserTokens(user, userAgent) {
    // Tạo access token
    const accessToken = await this.generateAccessToken(user);
    // Tạo refresh token
    const refreshToken = await this.generateRefreshToken(user, userAgent);

    return {
      accessToken,
      accessTokenTTL: authConfig.accessTokenTTL,
      refreshToken,
    };
  }
}

module.exports = new AuthService();