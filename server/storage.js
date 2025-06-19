const { db } = require('./db.js');
const { 
  guilds, 
  welcomeConfigs, 
  botSettings, 
  embedTemplates, 
  moderationLogs, 
  userWarnings,
  autoRoleConfigs,
  commandStats
} = require('../shared/schema.js');
const { eq, desc, and, count } = require('drizzle-orm');

class DatabaseStorage {
  // Guild operations
  async upsertGuild(guildData) {
    const [guild] = await db
      .insert(guilds)
      .values({
        ...guildData,
        updatedAt: new Date()
      })
      .onConflictDoUpdate({
        target: guilds.id,
        set: {
          name: guildData.name,
          iconUrl: guildData.iconUrl,
          memberCount: guildData.memberCount,
          updatedAt: new Date()
        }
      })
      .returning();
    return guild;
  }

  async getGuild(guildId) {
    const [guild] = await db.select().from(guilds).where(eq(guilds.id, guildId));
    return guild;
  }

  async getAllGuilds() {
    return await db.select().from(guilds);
  }

  // Welcome config operations
  async getWelcomeConfig(guildId) {
    const [config] = await db
      .select()
      .from(welcomeConfigs)
      .where(eq(welcomeConfigs.guildId, guildId));
    return config;
  }

  async upsertWelcomeConfig(configData) {
    // First try to update existing config
    const existing = await this.getWelcomeConfig(configData.guildId);
    
    if (existing) {
      const [updated] = await db
        .update(welcomeConfigs)
        .set({
          ...configData,
          updatedAt: new Date()
        })
        .where(eq(welcomeConfigs.guildId, configData.guildId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(welcomeConfigs)
        .values(configData)
        .returning();
      return created;
    }
  }

  async disableWelcomeConfig(guildId) {
    await db
      .update(welcomeConfigs)
      .set({ isEnabled: false, updatedAt: new Date() })
      .where(eq(welcomeConfigs.guildId, guildId));
  }

  // Bot settings operations
  async getBotSettings() {
    const [settings] = await db.select().from(botSettings).limit(1);
    return settings;
  }

  async upsertBotSettings(settingsData) {
    const existing = await this.getBotSettings();
    
    if (existing) {
      const [updated] = await db
        .update(botSettings)
        .set({
          ...settingsData,
          updatedAt: new Date()
        })
        .where(eq(botSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(botSettings)
        .values({
          status: 'online',
          activityType: 'playing',
          activityText: 'Discord Bot Dashboard',
          ...settingsData
        })
        .returning();
      return created;
    }
  }

  // Embed template operations
  async saveEmbedTemplate(templateData) {
    const [template] = await db
      .insert(embedTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  async getEmbedTemplates(guildId) {
    if (guildId) {
      return await db
        .select()
        .from(embedTemplates)
        .where(eq(embedTemplates.guildId, guildId))
        .orderBy(desc(embedTemplates.createdAt));
    } else {
      return await db
        .select()
        .from(embedTemplates)
        .orderBy(desc(embedTemplates.createdAt));
    }
  }

  async deleteEmbedTemplate(templateId) {
    await db.delete(embedTemplates).where(eq(embedTemplates.id, templateId));
  }

  // Moderation log operations
  async addModerationLog(logData) {
    const [log] = await db
      .insert(moderationLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getModerationLogs(guildId, limit = 50) {
    return await db
      .select()
      .from(moderationLogs)
      .where(eq(moderationLogs.guildId, guildId))
      .orderBy(desc(moderationLogs.createdAt))
      .limit(limit);
  }

  // User warnings operations
  async addUserWarning(warningData) {
    const [warning] = await db
      .insert(userWarnings)
      .values(warningData)
      .returning();
    return warning;
  }

  async getUserWarnings(guildId, userId) {
    return await db
      .select()
      .from(userWarnings)
      .where(
        and(
          eq(userWarnings.guildId, guildId),
          eq(userWarnings.userId, userId),
          eq(userWarnings.isActive, true)
        )
      )
      .orderBy(desc(userWarnings.createdAt));
  }

  async removeUserWarning(warningId) {
    await db
      .update(userWarnings)
      .set({ isActive: false })
      .where(eq(userWarnings.id, warningId));
  }

  // Auto-role operations
  async upsertAutoRoleConfig(configData) {
    const [config] = await db
      .insert(autoRoleConfigs)
      .values(configData)
      .onConflictDoUpdate({
        target: [autoRoleConfigs.guildId, autoRoleConfigs.roleId],
        set: {
          isEnabled: configData.isEnabled,
        }
      })
      .returning();
    return config;
  }

  async getAutoRoleConfigs(guildId) {
    return await db
      .select()
      .from(autoRoleConfigs)
      .where(
        and(
          eq(autoRoleConfigs.guildId, guildId),
          eq(autoRoleConfigs.isEnabled, true)
        )
      );
  }

  // Command statistics
  async recordCommandUsage(commandData) {
    const [stat] = await db
      .insert(commandStats)
      .values(commandData)
      .returning();
    return stat;
  }

  async getCommandStats(guildId, days = 30) {
    const query = db
      .select({
        commandName: commandStats.commandName,
        count: count()
      })
      .from(commandStats)
      .groupBy(commandStats.commandName)
      .orderBy(desc(count()));

    if (guildId) {
      query.where(eq(commandStats.guildId, guildId));
    }

    return await query;
  }

  // Utility methods for dashboard
  async getDashboardStats(guildId) {
    const stats = {};
    
    if (guildId) {
      // Guild-specific stats
      const guild = await this.getGuild(guildId);
      const [moderationCount] = await db.select({ count: count() }).from(moderationLogs).where(eq(moderationLogs.guildId, guildId));
      const [warningCount] = await db.select({ count: count() }).from(userWarnings).where(
        and(
          eq(userWarnings.guildId, guildId),
          eq(userWarnings.isActive, true)
        )
      );
      
      stats.guild = guild;
      stats.moderationActions = moderationCount.count;
      stats.activeWarnings = warningCount.count;
    } else {
      // Global stats
      const [totalGuilds] = await db.select({ count: count() }).from(guilds);
      const [totalModerationActions] = await db.select({ count: count() }).from(moderationLogs);
      const [totalWarnings] = await db.select({ count: count() }).from(userWarnings).where(eq(userWarnings.isActive, true));
      
      stats.totalGuilds = totalGuilds.count;
      stats.totalModerationActions = totalModerationActions.count;
      stats.totalActiveWarnings = totalWarnings.count;
    }
    
    return stats;
  }
}

const storage = new DatabaseStorage();
module.exports = { storage };