-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `authProvider` VARCHAR(191) NULL,
    `authProviderId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserProfile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `websiteUrl` VARCHAR(191) NULL,
    `languages` JSON NULL,
    `networkingGoals` JSON NULL,
    `whatIOffer` JSON NULL,
    `preferredTone` VARCHAR(191) NULL,
    `defaultContactCardLanguage` VARCHAR(191) NULL,
    `privacySettings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserProfile_userId_key`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Event` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `industry` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `eventGoal` TEXT NULL,
    `tags` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Event_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contact` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NULL,
    `title` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `linkedinUrl` VARCHAR(191) NULL,
    `websiteUrl` VARCHAR(191) NULL,
    `languages` JSON NULL,
    `sourceType` VARCHAR(191) NULL,
    `sourceConfidence` DOUBLE NULL,
    `tags` JSON NULL,
    `notes` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Contact_userId_idx`(`userId`),
    INDEX `Contact_eventId_idx`(`eventId`),
    INDEX `Contact_email_idx`(`email`),
    INDEX `Contact_phone_idx`(`phone`),
    INDEX `Contact_linkedinUrl_idx`(`linkedinUrl`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContactImport` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `sourceType` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NULL,
    `sourcePayload` JSON NULL,
    `rawExtractedText` TEXT NULL,
    `parsedJson` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContactImport_userId_idx`(`userId`),
    INDEX `ContactImport_eventId_idx`(`eventId`),
    INDEX `ContactImport_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interaction` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `interactionTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `meetingContext` TEXT NULL,
    `userNotes` TEXT NULL,
    `aiSummary` TEXT NULL,
    `nextAction` TEXT NULL,
    `outcome` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Interaction_userId_idx`(`userId`),
    INDEX `Interaction_contactId_idx`(`contactId`),
    INDEX `Interaction_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Briefing` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `agentRunId` VARCHAR(191) NULL,
    `personSummary` TEXT NULL,
    `whyTheyMatter` TEXT NULL,
    `likelyGoal` TEXT NULL,
    `decisionAuthority` VARCHAR(191) NULL,
    `talkingPoints` JSON NULL,
    `questionsToAsk` JSON NULL,
    `culturalNotes` JSON NULL,
    `warnings` JSON NULL,
    `confidenceScore` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Briefing_userId_idx`(`userId`),
    INDEX `Briefing_contactId_idx`(`contactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Ranking` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `eventId` VARCHAR(191) NULL,
    `goalText` TEXT NOT NULL,
    `modelName` VARCHAR(191) NULL,
    `promptVersion` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Ranking_userId_idx`(`userId`),
    INDEX `Ranking_eventId_idx`(`eventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RankingItem` (
    `id` VARCHAR(191) NOT NULL,
    `rankingId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `rankPosition` INTEGER NOT NULL,
    `score` DOUBLE NULL,
    `opportunityType` VARCHAR(191) NULL,
    `reasoning` TEXT NULL,
    `nextAction` TEXT NULL,
    `evidence` JSON NULL,
    `confidence` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RankingItem_rankingId_idx`(`rankingId`),
    INDEX `RankingItem_contactId_idx`(`contactId`),
    INDEX `RankingItem_rankPosition_idx`(`rankPosition`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FollowUp` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `interactionId` VARCHAR(191) NULL,
    `subject` VARCHAR(191) NULL,
    `draftText` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'drafted',
    `recommendedTiming` VARCHAR(191) NULL,
    `userApproved` BOOLEAN NOT NULL DEFAULT false,
    `sentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FollowUp_userId_idx`(`userId`),
    INDEX `FollowUp_contactId_idx`(`contactId`),
    INDEX `FollowUp_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Localisation` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `contactId` VARCHAR(191) NOT NULL,
    `agentRunId` VARCHAR(191) NULL,
    `openerText` TEXT NULL,
    `languageUsed` VARCHAR(191) NULL,
    `confidenceScore` DOUBLE NULL,
    `warnings` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Localisation_userId_idx`(`userId`),
    INDEX `Localisation_contactId_idx`(`contactId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AgentRun` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `taskType` VARCHAR(191) NULL,
    `agentType` VARCHAR(191) NULL,
    `modelName` VARCHAR(191) NULL,
    `promptVersion` VARCHAR(191) NULL,
    `inputJson` JSON NULL,
    `outputJson` JSON NULL,
    `status` VARCHAR(191) NULL,
    `latencyMs` INTEGER NULL,
    `tokenInput` INTEGER NULL,
    `tokenOutput` INTEGER NULL,
    `costEstimate` DOUBLE NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AgentRun_userId_idx`(`userId`),
    INDEX `AgentRun_agentType_idx`(`agentType`),
    INDEX `AgentRun_taskType_idx`(`taskType`),
    INDEX `AgentRun_status_idx`(`status`),
    INDEX `AgentRun_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ToolCall` (
    `id` VARCHAR(191) NOT NULL,
    `agentRunId` VARCHAR(191) NOT NULL,
    `toolName` VARCHAR(191) NULL,
    `inputJson` JSON NULL,
    `outputJson` JSON NULL,
    `status` VARCHAR(191) NULL,
    `latencyMs` INTEGER NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ToolCall_agentRunId_idx`(`agentRunId`),
    INDEX `ToolCall_toolName_idx`(`toolName`),
    INDEX `ToolCall_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NULL,
    `oldValue` JSON NULL,
    `newValue` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_userId_idx`(`userId`),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `AuditLog_action_idx`(`action`),
    INDEX `AuditLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feedback` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NULL,
    `entityId` VARCHAR(191) NULL,
    `rating` INTEGER NULL,
    `feedbackText` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Feedback_userId_idx`(`userId`),
    INDEX `Feedback_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `Feedback_rating_idx`(`rating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `UserProfile` ADD CONSTRAINT `UserProfile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contact` ADD CONSTRAINT `Contact_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Interaction` ADD CONSTRAINT `Interaction_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Briefing` ADD CONSTRAINT `Briefing_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Ranking` ADD CONSTRAINT `Ranking_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RankingItem` ADD CONSTRAINT `RankingItem_rankingId_fkey` FOREIGN KEY (`rankingId`) REFERENCES `Ranking`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RankingItem` ADD CONSTRAINT `RankingItem_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FollowUp` ADD CONSTRAINT `FollowUp_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Localisation` ADD CONSTRAINT `Localisation_contactId_fkey` FOREIGN KEY (`contactId`) REFERENCES `Contact`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AgentRun` ADD CONSTRAINT `AgentRun_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ToolCall` ADD CONSTRAINT `ToolCall_agentRunId_fkey` FOREIGN KEY (`agentRunId`) REFERENCES `AgentRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
