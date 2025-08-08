-- CreateTable
CREATE TABLE `Bus` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `bus_number` VARCHAR(20) NOT NULL,
    `capacity` INTEGER NOT NULL DEFAULT 45,
    `route_id` INTEGER NULL,
    `driver_id` INTEGER NULL,
    `conductor_id` INTEGER NULL,
    `status` ENUM('running', 'stopped', 'maintenance') NOT NULL DEFAULT 'stopped',
    `current_location` VARCHAR(200) NULL,
    `fuel_level` DECIMAL(5, 2) NULL DEFAULT 0,
    `last_maintenance` DATETIME(3) NULL,
    `insurance_expiry` DATETIME(3) NULL,
    `permit_expiry` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Bus_bus_number_key`(`bus_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Bus` ADD CONSTRAINT `Bus_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bus` ADD CONSTRAINT `Bus_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `Route`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bus` ADD CONSTRAINT `Bus_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `Driver`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bus` ADD CONSTRAINT `Bus_conductor_id_fkey` FOREIGN KEY (`conductor_id`) REFERENCES `Conductor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
