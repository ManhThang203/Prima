const jwt = require("jsonwebtoken");
const prisma = require("@/libs/prisma");
const bcrypt = require("bcrypt");
const authConfig = require("@/config/auth");

class AuthService {
  async register(email, password) {
    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
      },
    });
    return user;
  }

  generateAccessToken(user) {
    const expiresAt = Math.floor(Date.now() / 1000) + authConfig.accessTokenTTL;
    const tokenPayload = {
      sub: user.id,
      exp: expiresAt,
    };
    const accessToken = jwt.sign(tokenPayload, authConfig.jwtSecret);
    return accessToken;
  }

  /**
   * Tìm kiếm user theo ID
    getUserById ở bên auth không có như cầu tái sử dụng ở nhiều nơi, nên mình sẽ đặt nó ở đây để tránh phải tạo thêm 1 service khác chỉ để chứa 1 hàm getById
   */
  async getUserById(id) {
    // Kiểm tra đầu vào: không cho phép id rỗng, null hoặc undefined
    if (!id) throw new Error("User ID is required");

    // Truy vấn database, tìm đúng 1 user có id khớp
    // findUnique đảm bảo chỉ trả về 1 bản ghi duy nhất
    const user = await prisma.user.findUnique({
      select: {
        id: true,
        email: true,
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

    // Trả về user nếu tìm thấy, hoặc null nếu không có

    return user;
  }
}

module.exports = new AuthService();
