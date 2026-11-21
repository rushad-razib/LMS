-- AlterTable
ALTER TABLE `LiveSession`
    ADD COLUMN `sessionType` INTEGER NOT NULL DEFAULT 1,
    MODIFY COLUMN `meetingUrl` TEXT NULL;

-- CreateTable
CREATE TABLE `SessionAttendance` (
    `id` VARCHAR(191) NOT NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `present` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SessionAttendance_sessionId_userId_key`(`sessionId`, `userId`),
    INDEX `SessionAttendance_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SessionAttendance` ADD CONSTRAINT `SessionAttendance_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `LiveSession`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionAttendance` ADD CONSTRAINT `SessionAttendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
