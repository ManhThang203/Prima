const authConfig = require("@/config/auth");
const authService = require("@/services/auth.service");

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.register(email, password);
  const accesstoken = authService.generateAccessToken(user);

  res.success({
    accesstoken,
    accessTokenTTL: authConfig.accessTokenTTL,
  });
};

const getCurrentUser = async (req, res) => {
  res.success(req.auth.user);
};

module.exports = { register, getCurrentUser };
