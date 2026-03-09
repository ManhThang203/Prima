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

  async generateUserTokens(user, userAgent) {
    const expiresAt = Math.floor(Date.now() / 1000) + authConfig.accessTokenTTL;

    const accesstoken = jwt.sign(
      {
        userId: user.id,
        exp: expiresAt,
      },
      authConfig.jwtSecret,
    );

    return accesstoken;
  }
}

module.exports = new AuthService();
