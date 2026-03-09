const {
  PrismaClientValidationError,
} = require("@prisma/client/runtime/client");
const { prismaCodes, httpCodes } = require("@/config/constants");
const isProduction = require("@/utils/isProduction");

function errorHandle(error, req, res, next) {
  if (isProduction()) {
    // Write error log...
    return res.error("Server error.", 500);
  }

  if (error instanceof PrismaClientValidationError) {
    return res.error(
      {
        info: error,
        message: String(error),
      },
      500,
    );
  }

  if (error?.code === prismaCodes.duplicate) {
    return res.error(
      {
        message: "Duplicate entry.",
      },
      httpCodes.conflict,
    );
  }

  res.error(
    error
      ? {
          info: error,
          message: String(error),
        }
      : "Server error.",
    500,
  );
}

module.exports = errorHandle;
