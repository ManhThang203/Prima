const express = require("express");

const postController = require("@/controllers/post.controller");
const authRequired = require("@/middlewares/authRequired");

const router = express.Router();

// GET /api/posts - Public - with pagination
router.get("/", postController.getAll);

// GET /api/posts/:id - Public - get by ID
router.get("/:id", postController.getById);

// POST /api/posts - Auth required - create new post
router.post("/", authRequired, postController.create);

// PUT/PATCH /api/posts/:id - Auth required - update post (author only)
router.put("/:id", authRequired, postController.update);
router.patch("/:id", authRequired, postController.update);

// DELETE /api/posts/:id - Auth required - delete post (author only)
router.delete("/:id", authRequired, postController.remove);

module.exports = router;
