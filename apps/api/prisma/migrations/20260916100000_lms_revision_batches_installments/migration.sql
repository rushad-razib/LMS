ALTER TABLE `Course`
  ADD COLUMN `coverImageKey` VARCHAR(191) NULL,
  ADD COLUMN `coverImageUrl` TEXT NULL;

ALTER TABLE `Batch`
  ADD COLUMN `deliveryMode` ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'ONLINE',
  ADD COLUMN `seatCapacity` INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN `startDate` DATETIME(3) NULL,
  ADD COLUMN `endDate` DATETIME(3) NULL;

ALTER TABLE `Enrollment`
  ADD COLUMN `accessBlocked` BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE `InstallmentPlan` (
    `id` VARCHAR(191) NOT NULL,
    `enrollmentId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `courseId` VARCHAR(191) NOT NULL,
    `totalBdt` INTEGER NOT NULL,
    `months` INTEGER NOT NULL,
    `graceDays` INTEGER NOT NULL DEFAULT 10,
    `status` ENUM('ACTIVE', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `Installment` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `sequence` INTEGER NOT NULL,
    `amountBdt` INTEGER NOT NULL,
    `dueDate` DATETIME(3) NOT NULL,
    `payByDate` DATETIME(3) NOT NULL,
    `status` ENUM('DUE', 'PAID', 'OVERDUE') NOT NULL DEFAULT 'DUE',
    `paidAt` DATETIME(3) NULL,
    `paymentMethod` ENUM('CASH', 'CARD', 'SSLCOMMERZ_OFFLINE', 'OTHER') NULL,
    `orderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Installment_orderId_key`(`orderId`),
    UNIQUE INDEX `Installment_planId_sequence_key`(`planId`, `sequence`),
    INDEX `Installment_status_idx`(`status`),
    INDEX `Installment_dueDate_idx`(`dueDate`),
    INDEX `Installment_payByDate_idx`(`payByDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `InstallmentPlan_enrollmentId_key` ON `InstallmentPlan`(`enrollmentId`);
CREATE INDEX `InstallmentPlan_userId_idx` ON `InstallmentPlan`(`userId`);
CREATE INDEX `InstallmentPlan_courseId_idx` ON `InstallmentPlan`(`courseId`);
CREATE INDEX `InstallmentPlan_status_idx` ON `InstallmentPlan`(`status`);

ALTER TABLE `InstallmentPlan` ADD CONSTRAINT `InstallmentPlan_enrollmentId_fkey` FOREIGN KEY (`enrollmentId`) REFERENCES `Enrollment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `InstallmentPlan` ADD CONSTRAINT `InstallmentPlan_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `InstallmentPlan` ADD CONSTRAINT `InstallmentPlan_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Installment` ADD CONSTRAINT `Installment_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `InstallmentPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Installment` ADD CONSTRAINT `Installment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
