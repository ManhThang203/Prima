const prisma = require("@/libs/prisma");

class UserService {
  /**
   * Tìm kiếm user theo ID
    getUserById ở bên user.service có thể sẽ được tái sử dụng ở nhiều nơi, nên mình sẽ đặt nó ở đây để tránh phải tạo thêm 1 service khác chỉ để chứa 1 hàm getById
   */
  async getUserById(id) {
    // Kiểm tra đầu vào: không cho phép id rỗng, null hoặc undefined
    if (!id) throw new Error("User ID is required");

    // Truy vấn database, tìm đúng 1 user có id khớp
    // findUnique đảm bảo chỉ trả về 1 bản ghi duy nhất
    const user = await prisma.user.findUnique({
      where: { id },
    });

    // Trả về user nếu tìm thấy, hoặc null nếu không có

    return user;
  }
}

module.exports = new UserService();
