/**
 * Middleware xử lý lỗi tập trung cho ứng dụng
 * Bắt tất cả các lỗi phát sinh trong quá trình xử lý request
 */

// Import PrismaClientValidationError để kiểm tra lỗi validation từ Prisma ORM
const {
  PrismaClientValidationError,
} = require("@prisma/client/runtime/client");

// Import các hằng số từ file config
// - prismaCodes: các mã lỗi của Prisma (VD: duplicate, notFound,...)
// - httpCodes: các mã HTTP status (VD: 200, 400, 500,...)
const { prismaCodes, httpCodes } = require("@/config/constants");

// Import utility function để kiểm tra môi trường production
const isProduction = require("@/utils/isProduction");

/**
 * Middleware xử lý lỗi
 * @param {Error} error - Đối tượng lỗi được truyền từ các middleware/controller trước đó
 * @param {Object} req - Request object
 * @param {Object} res - Response object  
 * @param {Function} next - Next middleware function
 */
function errorHandle(error, req, res, next) {
  // === MÔI TRƯỜNG PRODUCTION ===
  // Nếu đang chạy ở môi trường production:
  // - Không hiển thị chi tiết lỗi cho client (bảo mật)
  // - Chỉ trả về thông báo lỗi chung chung
  // - Ghi log lỗi để admin kiểm tra sau
  if (isProduction()) {
    // TODO: Viết log lỗi vào file hoặc logging service (VD: Winston, Loggly)
    console.error("Production Error:", error); // Tạm thời log ra console

    // Trả về thông báo lỗi chung chung cho client
    return res.error("Server error.", 500);
  }

  // === MÔI TRƯỜNG DEVELOPMENT ===
  // Nếu đang chạy ở môi trường dev, hiển thị chi tiết lỗi để dễ debug

  // --- LỖI VALIDATION TỪ PRISMA ---
  // Kiểm tra nếu lỗi là PrismaClientValidationError
  // (Lỗi validation khi dữ liệu đầu vào không đúng format/schema)
  if (error instanceof PrismaClientValidationError) {
    return res.error(
      {
        info: error,        // Chi tiết lỗi (stack trace, message,...)
        message: String(error), // Chuyển đổi lỗi thành string để hiển thị
      },
      500, // HTTP status code 500 - Internal Server Error
    );
  }

  // --- LỖI TRÙNG LẶP (DUPLICATE ENTRY) ---
  // Kiểm tra nếu lỗi có mã là 'duplicate' từ Prisma
  // Thường xảy ra khi insert dữ liệu trùng với unique constraint
  // VD: Email đã tồn tại trong database
  if (error?.code === prismaCodes.duplicate) {
    return res.error(
      {
        message: "Duplicate entry.", // Thông báo lỗi thân thiện với user
      },
      httpCodes.conflict, // HTTP status code 409 - Conflict
    );
  }

  // --- XỬ LÝ CÁC LỖI KHÁC ---
  // Nếu không khớp với các lỗi đặc biệt ở trên:
  // - Hiển thị chi tiết lỗi (info + message) để dev debug
  // - Trả về HTTP 500 - Internal Server Error
  res.error(
    error
      ? {
        info: error,           // Toàn bộ thông tin lỗi (stack, cause,...)
        message: String(error), // Message lỗi dạng string
      }
      : "Server error.", // Nếu error không tồn tại (null/undefined), trả thông báo chung
    500,
  );
}

module.exports = errorHandle;
