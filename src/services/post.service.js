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
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
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
      prisma.post.count(),
    ]);

    return {
      data: posts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Get post by ID
   */
  async getById(id) {
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

    // Check if base slug exists
    const existingPost = await prisma.post.findUnique({
      where: { slug: baseSlug },
    });

    if (!existingPost) {
      return baseSlug;
    }

    // If exists, append number
    let counter = 1;
    let newSlug = `${baseSlug}-${counter}`;

    while (await prisma.post.findUnique({ where: { slug: newSlug } })) {
      counter++;
      newSlug = `${baseSlug}-${counter}`;
    }

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
    // Check if post exists and belongs to user
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return null;
    }

    if (existingPost.userId !== userId) {
      return "FORBIDDEN";
    }

    // Generate new slug if title changed
    let slug = existingPost.slug;
    if (data.title && data.title !== existingPost.title) {
      slug = await this.generateUniqueSlug(data.title);
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...data,
        slug,
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
