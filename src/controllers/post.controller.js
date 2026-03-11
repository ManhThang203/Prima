const postService = require("@/services/post.service");
const { httpCodes } = require("@/config/constants");

/**
 * GET /api/posts
 * Get all posts with pagination
 */
const getAll = async (req, res) => {
  const { page, limit } = req.query;

  const result = await postService.getAll(page, limit);
  res.success(result);
};

/**
 * GET /api/posts/:id
 * Get post by ID
 */
const getById = async (req, res) => {
  const { id } = req.params;
  const postId = BigInt(id);

  const post = await postService.getById(postId);

  if (!post) {
    return res.notFound();
  }

  res.success(post);
};

/**
 * POST /api/posts
 * Create new post (auth required)
 */
const create = async (req, res) => {
  const { title, description, content, image, minRead } = req.body;
  const userId = req.auth.user.id;

  const post = await postService.create({
    userId,
    title,
    description,
    content,
    image,
    minRead,
  });

  res.success(post, httpCodes.created);
};

/**
 * PUT/PATCH /api/posts/:id
 * Update post (auth required, only author)
 */
const update = async (req, res) => {
  const { id } = req.params;
  const postId = BigInt(id);
  const userId = req.auth.user.id;
  const { title, description, content, image, minRead } = req.body;

  const result = await postService.update(postId, userId, {
    title,
    description,
    content,
    image,
    minRead,
  });

  if (result === null) {
    return res.notFound();
  }

  if (result === "FORBIDDEN") {
    return res.forbidden();
  }

  res.success(result);
};

/**
 * DELETE /api/posts/:id
 * Delete post (auth required, only author)
 */
const remove = async (req, res) => {
  const { id } = req.params;
  const postId = BigInt(id);
  const userId = req.auth.user.id;

  const result = await postService.delete(postId, userId);

  if (result === false) {
    return res.notFound();
  }

  if (result === "FORBIDDEN") {
    return res.forbidden();
  }

  res.success(null, httpCodes.noContent);
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
};
