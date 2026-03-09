const postService = require("@/services/post.service");

const getAll = async (req, res) => {
  const posts = await postService.getAll();
  res.success(posts);
};

module.exports = { getAll };
