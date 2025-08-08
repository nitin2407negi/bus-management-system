-- CreateTable
CREATE TABLE `Ticket` (
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

    UNIQUE INDEX `Ticket_ticket_number_key`(`ticket_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Ticket` ADD CONSTRAINT `Ticket_bus_id_fkey` FOREIGN KEY (`bus_id`) REFERENCES `Bus`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
