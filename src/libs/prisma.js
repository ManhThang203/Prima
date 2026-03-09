const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("@root/generated/prisma");

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
