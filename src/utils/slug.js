/**
* Tạo slug từ tiêu đề
* - Chuyển đổi sang chữ thường
* - Thay thế khoảng trắng bằng "-"
* - Loại bỏ các ký tự đặc biệt (ngoại trừ "-", "_")
 */
function generateSlug(title) {
    if (!title) return "";

    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Loại bỏ các ký tự đặc biệt ngoại trừ "-", "_"
        .replace(/[\s_-]+/g, "-") // Thay thế dấu cách "_" bằng dấu gạch ngang "-"
        .replace(/^-+|-+$/g, ""); // Loại bỏ dấu đầu/cuối "-"
}

module.exports = { generateSlug };
