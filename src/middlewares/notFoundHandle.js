function notFoundHandle(req, res) {
  res.error(`Cannot ${req.method} ${req.url}`, 404);
}

module.exports = notFoundHandle;
