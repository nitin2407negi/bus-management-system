-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(15) NULL,
    `role` ENUM('owner', 'admin', 'conductor', 'driver') NOT NULL DEFAULT 'owner',
    `company_name` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `routes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `distance` DECIMAL(8, 2) NOT NULL,
    `base_fare` DECIMAL(8, 2) NOT NULL,
    `per_km_rate` DECIMAL(8, 2) NOT NULL,
    `stops` JSON NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `routes_code_key`(`code`),
    INDEX `idx_routes_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `license_number` VARCHAR(50) NOT NULL,
    `license_expiry` DATETIME(3) NULL,
    `experience_years` INTEGER NOT NULL DEFAULT 0,
    `address` VARCHAR(191) NULL,
    `emergency_contact` VARCHAR(15) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conductors` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(15) NOT NULL,
    `experience_years` INTEGER NOT NULL DEFAULT 0,
    `address` VARCHAR(191) NULL,
    `emergency_contact` VARCHAR(15) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `buses` (
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

    UNIQUE INDEX `buses_bus_number_key`(`bus_number`),
    INDEX `idx_buses_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tickets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bus_id` INTEGER NOT NULL,
    `ticket_number` VARCHAR(50) NOT NULL,
    `passenger_name` VARCHAR(100) NULL,
    `passenger_phone` VARCHAR(15) NULL,
    `from_stop` VARCHAR(100) NOT NULL,
    `to_stop` VARCHAR(100) NOT NULL,
    `passenger_type` ENUM('general', 'student', 'senior', 'disabled') NOT NULL DEFAULT 'general',
    `fare` DECIMAL(8, 2) NOT NULL,
    `issue_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `journey_date` DATETIME(3) NOT NULL,
    `status` ENUM('booked', 'used', 'cancelled') NOT NULL DEFAULT 'booked',

    UNIQUE INDEX `tickets_ticket_number_key`(`ticket_number`),
    INDEX `idx_tickets_bus_id`(`bus_id`),
    INDEX `idx_tickets_journey_date`(`journey_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `packages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bus_id` INTEGER NOT NULL,
    `package_number` VARCHAR(50) NOT NULL,
    `sender_name` VARCHAR(100) NOT NULL,
    `sender_phone` VARCHAR(15) NOT NULL,
    `receiver_name` VARCHAR(100) NOT NULL,
    `receiver_phone` VARCHAR(15) NOT NULL,
    `from_stop` VARCHAR(100) NOT NULL,
    `to_stop` VARCHAR(100) NOT NULL,
    `description` VARCHAR(191) NULL,
    `weight` DECIMAL(65, 30) NULL,
    `fare` DECIMAL(8, 2) NOT NULL,
    `status` ENUM('booked', 'in_transit', 'delivered', 'cancelled') NOT NULL DEFAULT 'booked',
    `booked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `delivered_at` DATETIME(3) NULL,

    UNIQUE INDEX `packages_package_number_key`(`package_number`),
    INDEX `idx_packages_bus_id`(`bus_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `daily_reports` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bus_id` INTEGER NOT NULL,
    `report_date` DATETIME(3) NOT NULL,
    `total_passengers` INTEGER NOT NULL DEFAULT 0,
    `total_revenue` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total_packages` INTEGER NOT NULL DEFAULT 0,
    `package_revenue` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `fuel_cost` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `maintenance_cost` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `idx_daily_reports_date`(`report_date`),
    UNIQUE INDEX `daily_reports_bus_id_report_date_key`(`bus_id`, `report_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `routes` ADD CONSTRAINT `routes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `drivers` ADD CONSTRAINT `drivers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conductors` ADD CONSTRAINT `conductors_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buses` ADD CONSTRAINT `buses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buses` ADD CONSTRAINT `buses_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buses` ADD CONSTRAINT `buses_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `buses` ADD CONSTRAINT `buses_conductor_id_fkey` FOREIGN KEY (`conductor_id`) REFERENCES `conductors`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tickets` ADD CONSTRAINT `tickets_bus_id_fkey` FOREIGN KEY (`bus_id`) REFERENCES `buses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `packages` ADD CONSTRAINT `packages_bus_id_fkey` FOREIGN KEY (`bus_id`) REFERENCES `buses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `daily_reports` ADD CONSTRAINT `daily_reports_bus_id_fkey` FOREIGN KEY (`bus_id`) REFERENCES `buses`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
