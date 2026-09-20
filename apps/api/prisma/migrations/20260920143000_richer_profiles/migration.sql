-- CreateTable
CREATE TABLE `TeacherProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `photoKey` VARCHAR(191) NULL,
    `photoUrl` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TeacherProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `StudentProfile`
    ADD COLUMN `whatsappPhone` VARCHAR(191) NULL,
    ADD COLUMN `dateOfBirth` DATE NULL,
    ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY') NULL,
    ADD COLUMN `nidNumber` VARCHAR(191) NULL,
    ADD COLUMN `addressLine` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `district` VARCHAR(191) NULL,
    ADD COLUMN `guardianName` VARCHAR(191) NULL,
    ADD COLUMN `guardianPhone` VARCHAR(191) NULL,
    ADD COLUMN `educationLevel` VARCHAR(191) NULL,
    ADD COLUMN `occupation` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `TeacherProfile` ADD CONSTRAINT `TeacherProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
