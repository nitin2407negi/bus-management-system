-- CreateTable
CREATE TABLE `Package` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bus_id` INTEGER NOT NULL,
    `package_number` VARCHAR(50) NOT NULL,
    `sender_name` VARCHAR(100) NOT NULL,
    `sender_phone` VARCHAR(15) NOT NULL,
    `receiver_name` VARCHAR(100) NOT NULL,
    `receiver_phone` VARCHAR(15) NOT NULL,
    `from_stop` VARCHAR(100) NOT NULL,
    `to_stop` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `weight` DECIMAL(8, 2) NULL,
    `fare` DECIMAL(8, 2) NOT NULL,
    `status` ENUM('booked', 'in_transit', 'delivered', 'cancelled') NOT NULL DEFAULT 'booked',
    `booked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `delivered_at` DATETIME(3) NULL,

    UNIQUE INDEX `Package_package_number_key`(`package_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Package` ADD CONSTRAINT `Package_bus_id_fkey` FOREIGN KEY (`bus_id`) REFERENCES `Bus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
