const { httpCodes } = require("@/config/constants");

function customResponse(req, res, next) {
  // Success
  res.success = (data, status = httpCodes.ok) => {
    res.status(status).json({
      data,
    });
  };

  // Error
  res.error = (error, status = httpCodes.internalServerError) => {
    res.status(status).json({
      error: error,
    });
  };

  // Not found
  res.notFound = () => {
    res.error("Resource not found.", httpCodes.notFound);
  };

  // Unauthorized
  res.unauthorized = () => {
    res.error("Unauthorized.", httpCodes.unauthorized);
  };

  next();
}

module.exports = customResponse;
