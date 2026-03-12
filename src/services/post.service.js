const prisma = require("@/libs/prisma");
const { generateSlug } = require("@/utils/slug");
const { DEFAULT_PAGE, DEFAULT_LIMIT } = require("@/config/constants");

class PostService {
  /**
   * Get all posts with pagination
   */
  async getAll(page = DEFAULT_PAGE, limit = DEFAULT_LIMIT) {
    const pageNum = parseInt(page) || DEFAULT_PAGE;
    const limitNum = parseInt(limit) || DEFAULT_LIMIT;
    // skip bỏ qua các bài viết
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      // findMany lấy ra các bài viết
      prisma.post.findMany({
        skip,
        take: limitNum,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          image: true,
          minRead: true,
          publishedAt: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.post.count(), // đếm số bài post đã được tạo
    ]);

    return {
      data: posts, // mảng bài viết
      pagination: {
        page: pageNum,// Trang hiện tại
        limit: limitNum, // số bài viết
        total,// tổng bài viết
        totalPages: Math.ceil(total / limitNum),// tổng số trang
      },
    };
  }

  /**
   * Get post by ID
   */
  async getById(id) {
    // findUnique  láy ra 1 bài viết
    const post = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        image: true,
        content: true,
        minRead: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
    return post;
  }

  /**
   * Get post by slug
   */
  async getBySlug(slug) {
    const post = await prisma.post.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        image: true,
        content: true,
        minRead: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
    return post;
  }

  /**
   * Generate unique slug
   */
  async generateUniqueSlug(title) {
    const baseSlug = generateSlug(title);

    // Kiểm tra xem slug trong  cơ sở dữ liệu đã tồn tại chưa
    const existingPost = await prisma.post.findUnique({
      where: { slug: baseSlug },
    });

    // Nếu chưa tồn tại thì trả về slug
    if (!existingPost) {
      return baseSlug;
    }

    // Nếu đã tồn tại thì thêm số vào slug
    let counter = 1;
    let newSlug = `${baseSlug}-${counter}`;

    // Kiểm tra xem slug có tồn tại không, nếu có thì tăng counter và tạo slug mới
    while (await prisma.post.findUnique({ where: { slug: newSlug } })) {
      counter++;
      newSlug = `${baseSlug}-${counter}`;
    }

    // Trả về slug mới
    return newSlug;
  }

  /**
   * Create new post
   */
  async create(data) {
    const { userId, title, description, content, image, minRead } = data;

    const slug = await this.generateUniqueSlug(title);

    const post = await prisma.post.create({
      data: {
        userId,
        title,
        slug,
        description,
        content,
        image,
        minRead,
        publishedAt: new Date(),
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        image: true,
        content: true,
        minRead: true,
        publishedAt: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return post;
  }

  /**
   * Update post (only by author)
   */
  async update(id, userId, data) {
    // Kiểm tra xem bài viết có tồn tại và thuộc về user không
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    // Lỗi: Không tìm thấy bài viết → NOT FOUND
    if (!existingPost) {
      return null;
    }

    // Lỗi: Bài viết không thuộc về user này → FORBIDDEN
    if (existingPost.userId !== userId) {
      return "FORBIDDEN";
    }

    // Tạo slug mới nếu tiêu đề thay đổi
    let slug = existingPost.slug;
    // Kiểm tra xem có title mới không và title mới có khác title cũ không
    if (data.title && data.title !== existingPost.title) {
      slug = await this.generateUniqueSlug(data.title);
    }

    // Cập nhật bài viết
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...data, // dữ liêu cần update (data được spread ra)
        slug,
      },
      // select để chọn các trường cần trả về
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        image: true,
        content: true,
        minRead: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    return post;
  }

  /**
   * Delete post (only by author)
   */
  async delete(id, userId) {
    // Check if post exists
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return false;
    }

    // Check if user is author
    if (existingPost.userId !== userId) {
      return "FORBIDDEN";
    }

    await prisma.post.delete({
      where: { id },
    });

    return true;
  }
}

module.exports = new PostService();
