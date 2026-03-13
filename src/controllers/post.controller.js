const postService = require("@/services/post.service");
const { httpCodes } = require("@/config/constants");
const postTransformer = require("@/transformers/post.transformer");

/**
 * GET /api/posts
 * Get all posts with pagination
 */
const getAll = async (req, res) => {
  const { page, limit } = req.query;

  const result = await postService.getAll(page, limit);
  const transformers = postTransformer(result.data);
  res.success({
    data: transformers,
    pagination: result.pagination,
  });
};

/**
 * GET /api/posts/:id
 * Get post by ID
 */
const getById = async (req, res) => {
  const { id } = req.params;
  const postId = BigInt(id);// convert sang BigInt để match với kiểu dữ liệu trong DB

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
    minRead: minRead ? Number(minRead) : null,
  });

  res.success(post, httpCodes.created);
};

/**
 * PUT /api/posts/:id
 * Update post - replace all fields (auth required, only author)
 * Missing fields will be set to null
 */
const put = async (req, res) => {
  const { id } = req.params;
  const postId = BigInt(id);
  const userId = req.auth.user.id;
  const { title, description, content, image, minRead } = req.body;

  const result = await postService.update(postId, userId, {
    title: title ?? null,
    description: description ?? null,
    content: content ?? null,
    image: image ?? null,
    minRead: minRead ? Number(minRead) : null,
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
 * PATCH /api/posts/:id
 * Update post - partial update (auth required, only author)
 * Missing fields will keep existing values
 */
const patch = async (req, res) => {
  const { id } = req.params;
  const postId = BigInt(id);
  const userId = req.auth.user.id;
  const { title, description, content, image, minRead } = req.body;

  // Chỉ bao gồm các trường được cung cấp (không phải trường chưa được định nghĩa).
  const updateData = {};
  // Kiểm tra xem có title mới không và title mới có khác title cũ không
  if (title !== undefined) updateData.title = title;
  // Kiểm tra xem có description mới không và description mới có khác description cũ không
  if (description !== undefined) updateData.description = description;
  // Kiểm tra xem có content mới không và content mới có khác content cũ không
  if (content !== undefined) updateData.content = content;
  // Kiểm tra xem có image mới không và image mới có khác image cũ không
  if (image !== undefined) updateData.image = image;
  // Kiểm tra xem có minRead mới không và minRead mới có khác minRead cũ không
  if (minRead !== undefined) updateData.minRead = minRead ? Number(minRead) : null;

  const result = await postService.update(postId, userId, updateData);

  if (result === null) {
    return res.notFound();
  }
  if (result === "FORBIDDEN") {
    return res.forbidden();
  }

  res.success(result);
};

/**
 * @deprecated Use put or patch instead
 */
const update = async (req, res) => {
  const { id } = req.params;
  const postId = BigInt(id);
  const userId = req.auth.user.id;
  const { title, description, content, image, minRead } = req.body;

  const result = await postService.update(postId, userId, {
    title: title ?? null,
    description: description ?? null,
    content: content ?? null,
    image: image ?? null,
    minRead: minRead ? Number(minRead) : null,
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

  // Lỗi: Không tìm thấy bài viết → NOT FOUNDLỗi: Không tìm thấy bài viết → NOT FOUND
  if (result === false) {
    return res.notFound();
  }

  // Lỗi: Bài viết không thuộc về user này → FORBIDDEN
  if (result === "FORBIDDEN") {
    return res.forbidden();
  }

  res.success({ message: "Xóa bài viết thành công" });
};

module.exports = {
  getAll,
  getById,
  create,
  put,
  patch,
  remove,
};
