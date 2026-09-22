-- AlterTable
ALTER TABLE `WebsiteSettings`
    ADD COLUMN `siteName` VARCHAR(191) NULL,
    ADD COLUMN `headerLogoKey` VARCHAR(191) NULL,
    ADD COLUMN `headerLogoUrl` TEXT NULL,
    ADD COLUMN `footerLogoKey` VARCHAR(191) NULL,
    ADD COLUMN `footerLogoUrl` TEXT NULL,
    ADD COLUMN `footerCopyright` TEXT NULL;
