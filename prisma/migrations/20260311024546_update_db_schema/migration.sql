/*
  Warnings:

  - You are about to drop the `comment` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `postIdeaId` to the `posts` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `posts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `posts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `posts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userAgent` on table `refresh_tokens` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `comment` DROP FOREIGN KEY `comment_userId_fkey`;

-- DropForeignKey
ALTER TABLE `refresh_tokens` DROP FOREIGN KEY `refresh_tokens_userId_fkey`;

-- DropIndex
DROP INDEX `refresh_tokens_userId_fkey` ON `refresh_tokens`;

-- AlterTable
ALTER TABLE `posts` ADD COLUMN `postIdeaId` BIGINT NOT NULL,
    MODIFY `content` TEXT NOT NULL,
    MODIFY `description` TEXT NOT NULL,
    MODIFY `image` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `refresh_tokens` ADD COLUMN `isRevoked` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `token` VARCHAR(191) NOT NULL,
    MODIFY `userAgent` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `password` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `comment`;

-- CreateTable
CREATE TABLE `comments` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `content` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
