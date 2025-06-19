import { db } from './db';
import { 
  guilds, 
  welcomeConfigs, 
  botSettings, 
  embedTemplates, 
  moderationLogs, 
  userWarnings,
  autoRoleConfigs,
  commandStats,
  type Guild,
  type InsertGuild,
  type WelcomeConfig,
  type InsertWelcomeConfig,
  type BotSettings,
  type InsertBotSettings,
  type EmbedTemplate,
  type InsertEmbedTemplate,
  type ModerationLog,
  type InsertModerationLog,
  type UserWarning,
  type InsertUserWarning,
  type AutoRoleConfig,
  type InsertAutoRoleConfig,
  type CommandStat,
  type InsertCommandStat
} from '../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

export class DatabaseStorage {
  // Guild operations
  async upsertGuild(guildData: InsertGuild): Promise<Guild> {
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

  async getGuild(guildId: string): Promise<Guild | undefined> {
    const [guild] = await db.select().from(guilds).where(eq(guilds.id, guildId));
    return guild;
  }

  async getAllGuilds(): Promise<Guild[]> {
    return await db.select().from(guilds);
  }

  // Welcome config operations
  async getWelcomeConfig(guildId: string): Promise<WelcomeConfig | undefined> {
    const [config] = await db
      .select()
      .from(welcomeConfigs)
      .where(eq(welcomeConfigs.guildId, guildId));
    return config;
  }

  async upsertWelcomeConfig(configData: InsertWelcomeConfig): Promise<WelcomeConfig> {
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

  async disableWelcomeConfig(guildId: string): Promise<void> {
    await db
      .update(welcomeConfigs)
      .set({ isEnabled: false, updatedAt: new Date() })
      .where(eq(welcomeConfigs.guildId, guildId));
  }

  // Bot settings operations
  async getBotSettings(): Promise<BotSettings | undefined> {
    const [settings] = await db.select().from(botSettings).limit(1);
    return settings;
  }

  async upsertBotSettings(settingsData: Partial<InsertBotSettings>): Promise<BotSettings> {
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
  async saveEmbedTemplate(templateData: InsertEmbedTemplate): Promise<EmbedTemplate> {
    const [template] = await db
      .insert(embedTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  async getEmbedTemplates(guildId?: string): Promise<EmbedTemplate[]> {
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

  async deleteEmbedTemplate(templateId: number): Promise<void> {
    await db.delete(embedTemplates).where(eq(embedTemplates.id, templateId));
  }

  // Moderation log operations
  async addModerationLog(logData: InsertModerationLog): Promise<ModerationLog> {
    const [log] = await db
      .insert(moderationLogs)
      .values(logData)
      .returning();
    return log;
  }

  async getModerationLogs(guildId: string, limit: number = 50): Promise<ModerationLog[]> {
    return await db
      .select()
      .from(moderationLogs)
      .where(eq(moderationLogs.guildId, guildId))
      .orderBy(desc(moderationLogs.createdAt))
      .limit(limit);
  }

  // User warnings operations
  async addUserWarning(warningData: InsertUserWarning): Promise<UserWarning> {
    const [warning] = await db
      .insert(userWarnings)
      .values(warningData)
      .returning();
    return warning;
  }

  async getUserWarnings(guildId: string, userId: string): Promise<UserWarning[]> {
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

  async removeUserWarning(warningId: number): Promise<void> {
    await db
      .update(userWarnings)
      .set({ isActive: false })
      .where(eq(userWarnings.id, warningId));
  }

  // Auto-role operations
  async upsertAutoRoleConfig(configData: InsertAutoRoleConfig): Promise<AutoRoleConfig> {
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

  async getAutoRoleConfigs(guildId: string): Promise<AutoRoleConfig[]> {
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
  async recordCommandUsage(commandData: InsertCommandStat): Promise<CommandStat> {
    const [stat] = await db
      .insert(commandStats)
      .values(commandData)
      .returning();
    return stat;
  }

  async getCommandStats(guildId?: string, days: number = 30): Promise<any[]> {
    const query = db
      .select({
        commandName: commandStats.commandName,
        count: db.$count()
      })
      .from(commandStats)
      .groupBy(commandStats.commandName)
      .orderBy(desc(db.$count()));

    if (guildId) {
      query.where(eq(commandStats.guildId, guildId));
    }

    return await query;
  }

  // Utility methods for dashboard
  async getDashboardStats(guildId?: string) {
    const stats: any = {};
    
    if (guildId) {
      // Guild-specific stats
      const guild = await this.getGuild(guildId);
      const moderationCount = await db.$count(moderationLogs, eq(moderationLogs.guildId, guildId));
      const warningCount = await db.$count(userWarnings, 
        and(
          eq(userWarnings.guildId, guildId),
          eq(userWarnings.isActive, true)
        )
      );
      
      stats.guild = guild;
      stats.moderationActions = moderationCount;
      stats.activeWarnings = warningCount;
    } else {
      // Global stats
      const totalGuilds = await db.$count(guilds);
      const totalModerationActions = await db.$count(moderationLogs);
      const totalWarnings = await db.$count(userWarnings, eq(userWarnings.isActive, true));
      
      stats.totalGuilds = totalGuilds;
      stats.totalModerationActions = totalModerationActions;
      stats.totalActiveWarnings = totalWarnings;
    }
    
    return stats;
  }
}

export const storage = new DatabaseStorage();