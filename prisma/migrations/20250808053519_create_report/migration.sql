-- CreateTable
CREATE TABLE `DailyReport` (
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

    UNIQUE INDEX `DailyReport_bus_id_report_date_key`(`bus_id`, `report_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DailyReport` ADD CONSTRAINT `DailyReport_bus_id_fkey` FOREIGN KEY (`bus_id`) REFERENCES `Bus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
