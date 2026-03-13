require("dotenv").config();
require("module-alias/register");
const { Output } = require("ai");
const { z } = require("zod");
const readingTime = require("reading-time");

const aiService = require("@/services/ai.service");
const prisma = require("@/libs/prisma");
const slugify = require("@/utils/slug");

async function main() {
  const idea = await prisma.postIdea.findFirst({
    where: {
      status: "pending",
    },
    orderBy: {
      id: "asc",
    },
  });
  if (!idea) {
    return console.log("No idea");
  }

  const prompt = `
    Bạn hãy viết một bài blog chuyên môn chia sẻ kiến thức lập trình dành cho đối tượng người mới bắt đầu hoàn toàn. Bài viết phải tuân thủ nghiêm ngặt các tiêu chí sau:

    Thông tin đầu vào:
      - Chủ đề bài viết (Title): ${idea.title}
      - Mục tiêu và phạm vi (Description):  ${idea.description}

    Cấu trúc và yêu cầu bài viết:

      Tiêu đề và mở đầu:
        - Tạo title/hook hấp dẫn từ title đã cho. Tuyệt đối không dùng Title Case (ví dụ: "Hàm Trong Python" là sai, "Hàm trong python" mới đúng). Chỉ viết hoa chữ cái đầu câu và danh từ riêng.
        - Viết một đoạn mở bài khoảng 200-300 từ. Giới thiệu chủ đề một cách thân thiện, giải thích tại sao nó quan trọng với người mới, và mô tả ngắn gọn những gì độc giả sẽ học được.

      Nội dung chính:
        - Nội dung khoảng 200 - 500 từ, chia thành 4 đến 5 phần lớn với các tiêu đề con (dùng heading H2, H3). Cấu trúc đi từ khái niệm cơ bản, đến ví dụ minh họa, rồi ứng dụng thực tế.
        - Văn phong: Dùng ngôi "mình" hoặc "tôi" (đảm bảo đồng nhất trong cả bài chỉ dùng 1 ngôi), giọng văn gần gũi, khuyến khích. Giải thích mọi khái niệm từ gốc, coi như người đọc chưa biết gì. Ưu tiên dùng đoạn văn ngắn (3-4 câu).
        - Giải thích kiến thức: Với mỗi khái niệm quan trọng, phải có: (a) Định nghĩa đơn giản bằng tiếng Việt, (b) Một ví dụ so sánh (analogy) từ đời sống, và (c) Một ví dụ mã code hoặc tình huống cụ thể.
        - Ví dụ minh họa: Mỗi ví dụ code phải ngắn gọn, tập trung vào một ý. Code phải có comment giải thích từng bước bằng tiếng Việt và phần kết quả mong đợi (output). Nên có cả ví dụ đúng và ví dụ sai thường gặp.
        - Hình ảnh mô tả: Với các bước hoặc khái niệm phức tạp, hãy mô tả bằng lời một hình ảnh hoặc sơ đồ nên có (ví dụ: "Hãy tưởng tượng một sơ đồ với các hộp nối tiếp nhau...") để người đọc dễ hình dung.

      Kết bài:
        - Tóm tắt ngắn gọn 3-5 điểm chính quan trọng nhất.
        - Đề xuất một bước thực hành nhỏ hoặc một bài tập độc giả có thể tự làm ngay.

      Quy tắc bắt buộc về hình thức:
        - Tránh lạm dụng thuật ngữ khó hiểu cho người mới
        - Tránh có câu văn không tự nhiên theo cách nửa Anh nửa Việt (chấp nhận những trường hợp phổ biến)
        - Tuyệt đối không sử dụng bất kỳ emoji hay ký tự đặc biệt trang trí nào (như ⭐, ✅, 🚀, ---).
        - Thay vì dùng "→", hãy dùng "->"; thay vì "–", hãy dùng "-"
        - Chỉ sử dụng các định dạng văn bản cơ bản: in đậm, in nghiêng, danh sách gạch đầu dòng, và code block.
        - Trong toàn bộ bài viết, cố ý tạo ra các lỗi đánh máy ngẫu nhiên với tỉ lệ khoảng 3%. Các lỗi này phải là lỗi thông thường, không làm thay đổi nghĩa câu và người đọc dễ dàng hiểu được từ đúng (ví dụ: "kiến thức" thành "kiến thức", "thực hành" thành "thực hàn", "quan trọng" thành "quan trọn"). Tuyệt đối không tạo ra từ phản cảm hoặc tục tĩu.
        - Mục tiêu cuối cùng: Bài viết phải khiến một người hoàn toàn mới hiểu được chủ đề [Title], cảm thấy tự tin để thử nghiệm, và biết bước tiếp theo cần làm gì.  
  
      Quy tắc BẮT BUỘC về format đầu ra:
        - Đầu ra chỉ bao gồm JSON có định dạng sau: {
          "title: "<title/hook chuẩn SEO, hấp dẫn, thu hút độc giả>",
          "description: "<mô tả bài viết chuẩn SEO, thu hút độc giả, tạo tò mò, ...>",
          "content: "<Nội dung chính, định dạng markdown>",
          "thumb_prompt": "<Prompt mô tả để tạo thumbnail phù hợp cho bài viết, style (text, color, size, ...) hiện đại, phù hợp với nội dung. Trong prompt nêu rõ tạo thumbnail cho bài viết có tiêu đề là gì. Kích thước ảnh 400x224>"
        }
  `;
  console.log({ prompt });
  // Gọi AI service để generate nội dung
  const output = Output.object({
    schema: z.object({
      title: z.string(),
      description: z.string(),
      content: z.string(),
      thumb_prompt: z.string(),
    }),
  });
  const response = await aiService.generateText("openai/gpt-4o-mini", prompt, output);
  const result = JSON.parse(response);

  console.log({ result });

  // Generate thumbnail từ AI image service
  const thumbnailPath = await aiService.generateImage(result.thumb_prompt, "posts");

  // Tạo post trong database
  const post = await prisma.post.create({
    data: {
      userId: 1,
      postIdeaId: idea.id,
      title: result.title,
      slug: slugify.generateSlug(result.title),
      description: result.description,
      content: result.content,
      image: thumbnailPath,
      minRead: readingTime(result.content).minutes,
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log({ post });

  // Cập nhật status của idea
  await prisma.postIdea.update({
    where: {
      id: idea.id,
    },
    data: {
      status: "completed",
    },
  });
}

main();