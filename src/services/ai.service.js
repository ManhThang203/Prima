const { Buffer } = require("node:buffer");
const fs = require("node:fs/promises");
const path = require("node:path");
const sharp = require("sharp");
const { gateway, generateText } = require("ai");

const randomString = require("@/utils/randomString");

class AIService {
  constructor() {
    // Setup...
  }

  /**
   * Gọi AI để sinh văn bản
   */
  async generateText(model, prompt, output, tools) {
    const { text } = await generateText({ model, prompt, output, tools });
    return text;
  }

  /**
   * Tìm kiếm web bằng Perplexity, ưu tiên nội dung tiếng Việt/Anh trong năm gần nhất
   */
  async webSearch(prompt, output) {
    return this.generateText("openai/gpt-4o-mini", prompt, output, {
      perplexity_search: gateway.tools.perplexitySearch({
        country: "VN",
        searchLanguageFilter: ["vi", "en"],
        searchRecencyFilter: "year",
      }),
    });
  }

  stream() {
    // ...
  }

  /**
   * Tạo ảnh từ prompt bằng AI, resize về 400px và lưu dưới dạng PNG nén
   */
  async generateImage(prompt, filePath = "ai-generated", model = "google/gemini-3-pro-image") {
    const result = await generateText({ model, prompt });

    if (!result.files.length) {
      throw new Error("No image.");
    }
    // Bước 1 — Lấy dữ liệu ảnh từ kết quả AI
    const { base64Data, mediaType } = result.files[0];
    // Bước 2 — Chuyển đổi base64 thành Buffer
    const imageBuffer = Buffer.from(base64Data, "base64");
    // Bước 3 — Tạo tên file ngẫu nhiên
    const imageName = `${randomString(8)}.${mediaType.split("/").pop()}`;
    // Bước 4 — Tạo đường dẫn lưu file
    // __dirname là đường dẫn tới thư mục chứa file hiện tại
    const dirPath = path.join(__dirname, "..", "..", "public", "images", filePath);
    // imagePath là đường dẫn tới file ảnh
    const imagePath = path.join(dirPath, imageName);
    // Bước 5 — Tạo thư mục nếu chưa tồn tại
    await this.createFolderIfNotExists(dirPath);
    // Bước 6 — Resize ảnh về 400px và lưu dưới dạng PNG nén
    await sharp(imageBuffer)
      .resize(400)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(imagePath);
    // Bước 7 — Trả về đường dẫn tương đối đến ảnh đã lưu
    return path.join("images", filePath, imageName);
  }

  /**
   * Tạo thư mục nếu chưa tồn tại (bao gồm cả thư mục cha)
   */
  async createFolderIfNotExists(folderPath) {
    try {
      await fs.mkdir(folderPath, { recursive: true });
    } catch (err) {
      console.error(`Error creating directory: ${err.message}`);
    }
  }
}

module.exports = new AIService();