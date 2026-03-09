const prisma = require("@/libs/prisma");

class PostService {
  async getAll() {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        publishedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });
    return posts;
  }
}

module.exports = new PostService();
