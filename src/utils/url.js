const appConfig = require("@/config/app.config");

const fullUrl = (path) => {
    return `${appConfig.BACKEND_URL}/${path.replace(/\\/g, "/")}`;
};

module.exports = { fullUrl };