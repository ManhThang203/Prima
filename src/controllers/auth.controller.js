const authConfig = require("@/config/auth");
const authService = require("@/services/auth.service");

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.register(email, password);
  const accesstoken = await authService.generateUserTokens(user);

  res.success({
    accesstoken,
    accessTokenTTL: authConfig.accessTokenTTL,
  });
};

module.exports = { register };
