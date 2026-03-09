const express = require("express");
const { readdirSync } = require("fs");

const route = express.Router();

// Quy ước đặt tên: chỉ load các file có đuôi ".route.js"
const postfix = ".route.js";

readdirSync(__dirname) // Đọc tất cả file trong thư mục hiện tại (routes/)
  .filter((__name) => __name.endsWith(postfix)) // Lọc đúng file *.route.js
  .forEach((fileName) => {
    // Tách tên resource từ fileName
    const resource = fileName.replace(postfix, "");

    // Tự động mount route theo tên file
    route.use(`/${resource}`, require(`./${fileName}`));
  });

module.exports = route;
