require("dotenv").config();
require("module-alias/register");
const prisma = require("@/libs/prisma");
const aiService = require("@/services/ai.service");
const { Output } = require("ai");
const { z } = require("zod");

async function main() {
  const ideas = await prisma.postIdea.findMany({
    select: {
      title: true,
    },
  });
  const titles = ideas.map((idea) => idea.title);
  const prompt = `Tìm 5 ý tưởng viết blog chủ đề lập trình web cho người mới bắt đầu.
    - Đánh giá xem người Việt Nam khi tiếp cận với chủ đề lập trình sẽ muốn đọc về topic như nào
    - Mục tiêu là chọn ra các chủ đề hấp dẫn khách hàng tiềm năng có khả năng cao sẽ chuyển đổi mua khóa học
    - Đảm bảo nội dung là cung cấp kiến, giá trị, ... cho độc giả (ưu tiên hàng đầu)
    - Đảm bảo các chủ đề không trùng lặp, không cần giống nhau, ...
    - Các ý tưởng mới không được trùng với các ý tưởng đã có, danh sách ý tưởng đã có:
        - ${titles.join(`
        - `)}

    BẮT BUỘC VỀ ĐỊNH DẠNG ĐẦU RA LÀ JSON NHƯ SAU: [
      {
        "title": "<tiêu đề topic 1>",
        "description": "<Mô tả mục tiêu cần đạt được trong nội dung chi tiết cho topic 1>"
      },
      {
        "title": "<tiêu đề topic 2>",
        "description": "<Mô tả mục tiêu cần đạt được trong nội dung chi tiết cho topic 2>"
      },
      {
        "title": "<tiêu đề topic 2>",
        "description": "<Mô tả mục tiêu cần đạt được trong nội dung chi tiết cho topic 2>"
      },
      {
        "title": "<tiêu đề topic 2>",
        "description": "<Mô tả mục tiêu cần đạt được trong nội dung chi tiết cho topic 2>"
      },
      {
        "title": "<tiêu đề topic 2>",
        "description": "<Mô tả mục tiêu cần đạt được trong nội dung chi tiết cho topic 2>"
      },
    ]
    Trả về chính xác định dạng JSON trên, không bao gồm thêm bất cứ điều gì như: giải thích, kết luận, ..., không sử dụng markdown."`;
  const output = Output.array({
    element: z.object({
      title: z.string(),
      description: z.string(),
    }),
  });
  console.log(prompt);
  const response = await aiService.webSearch(prompt, output);
  // response là string, cần parse sang JSON
  const postIdeas = JSON.parse(response).elements;

  await prisma.postIdea.createMany({
    data: postIdeas,
  });
}

main();
