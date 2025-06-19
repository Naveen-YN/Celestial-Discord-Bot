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

  // Custom Commands Management
  async createCustomCommand(commandData) {
    try {
      const query = `
        INSERT INTO custom_commands (guild_id, command_name, description, response, response_type, embed_data, permissions, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        commandData.guildId || null,
        commandData.commandName,
        commandData.description,
        commandData.response,
        commandData.responseType || 'text',
        JSON.stringify(commandData.embedData || null),
        commandData.permissions || 'everyone',
        commandData.createdBy
      ];
      
      const result = await db.query(query, values);
      const row = result.rows[0];
      return {
        ...row,
        embedData: row.embed_data ? JSON.parse(row.embed_data) : null
      };
    } catch (error) {
      console.error('Error creating custom command:', error);
      throw error;
    }
  }

  async getCustomCommands(guildId) {
    try {
      const query = 'SELECT * FROM custom_commands ORDER BY created_at DESC LIMIT 20';
      const result = await db.query(query);
      
      return result.rows.map(row => ({
        id: row.id,
        commandName: row.command_name,
        description: row.description,
        response: row.response,
        responseType: row.response_type,
        embedData: row.embed_data ? JSON.parse(row.embed_data) : null,
        permissions: row.permissions,
        isEnabled: row.is_enabled,
        usageCount: row.usage_count,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('Error getting custom commands:', error);
      return [];
    }
  }

  async getCustomCommand(commandName, guildId) {
    try {
      const query = 'SELECT * FROM custom_commands WHERE command_name = $1 LIMIT 1';
      const result = await db.query(query, [commandName]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        ...row,
        embedData: row.embed_data ? JSON.parse(row.embed_data) : null
      };
    } catch (error) {
      console.error('Error getting custom command:', error);
      return null;
    }
  }

  async updateCustomCommand(id, updates) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'embedData') {
          fields.push(`embed_data = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }

      fields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE custom_commands 
        SET ${fields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);
      const row = result.rows[0];
      
      return {
        ...row,
        embedData: row.embed_data ? JSON.parse(row.embed_data) : null
      };
    } catch (error) {
      console.error('Error updating custom command:', error);
      throw error;
    }
  }

  async deleteCustomCommand(id) {
    try {
      const query = 'DELETE FROM custom_commands WHERE id = $1';
      await db.query(query, [id]);
    } catch (error) {
      console.error('Error deleting custom command:', error);
      throw error;
    }
  }

  async incrementCommandUsage(commandName, guildId) {
    try {
      const query = 'UPDATE custom_commands SET usage_count = usage_count + 1 WHERE command_name = $1';
      await db.query(query, [commandName]);
    } catch (error) {
      console.error('Error incrementing command usage:', error);
    }
  }

  // Bot Messages Management
  async saveBotMessage(messageData) {
    try {
      const query = `
        INSERT INTO bot_messages (guild_id, channel_id, message_id, message_type, content, embed_data, sent_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const values = [
        messageData.guildId,
        messageData.channelId,
        messageData.messageId,
        messageData.messageType,
        messageData.content,
        JSON.stringify(messageData.embedData || null),
        messageData.sentBy
      ];
      
      const result = await db.query(query, values);
      const row = result.rows[0];
      
      return {
        ...row,
        embedData: row.embed_data ? JSON.parse(row.embed_data) : null
      };
    } catch (error) {
      console.error('Error saving bot message:', error);
      return null;
    }
  }

  async getBotMessages(guildId = 'current', limit = 50) {
    try {
      const query = 'SELECT * FROM bot_messages WHERE is_deleted = false ORDER BY sent_at DESC LIMIT $1';
      const result = await db.query(query, [limit]);
      
      return result.rows.map(row => ({
        id: row.id,
        guildId: row.guild_id,
        channelId: row.channel_id,
        messageId: row.message_id,
        messageType: row.message_type,
        content: row.content,
        embedData: row.embed_data ? JSON.parse(row.embed_data) : null,
        sentBy: row.sent_by,
        sentAt: row.sent_at,
        lastEditedAt: row.last_edited_at,
        isDeleted: row.is_deleted
      }));
    } catch (error) {
      console.error('Error getting bot messages:', error);
      return [];
    }
  }

  async getBotMessage(messageId) {
    try {
      const query = 'SELECT * FROM bot_messages WHERE message_id = $1';
      const result = await db.query(query, [messageId]);
      
      if (result.rows.length === 0) return null;
      
      const row = result.rows[0];
      return {
        ...row,
        embedData: row.embed_data ? JSON.parse(row.embed_data) : null
      };
    } catch (error) {
      console.error('Error getting bot message:', error);
      return null;
    }
  }

  async updateBotMessage(messageId, updates) {
    try {
      const fields = [];
      const values = [];
      let paramCount = 1;

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'embedData') {
          fields.push(`embed_data = $${paramCount}`);
          values.push(JSON.stringify(value));
        } else {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
          fields.push(`${dbKey} = $${paramCount}`);
          values.push(value);
        }
        paramCount++;
      }

      fields.push(`last_edited_at = NOW()`);
      values.push(messageId);

      const query = `
        UPDATE bot_messages 
        SET ${fields.join(', ')}
        WHERE message_id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);
      const row = result.rows[0];
      
      return {
        ...row,
        embedData: row.embed_data ? JSON.parse(row.embed_data) : null
      };
    } catch (error) {
      console.error('Error updating bot message:', error);
      throw error;
    }
  }

  async deleteBotMessage(messageId) {
    try {
      const query = 'UPDATE bot_messages SET is_deleted = true WHERE message_id = $1';
      await db.query(query, [messageId]);
    } catch (error) {
      console.error('Error deleting bot message:', error);
      throw error;
    }
  }

  // Server Logs Management
  async getServerLogs(guildId = 'current', type = 'all', date = null, limit = 100) {
    try {
      // Return real-time log data from moderation_logs and command_stats
      let queries = [];
      
      // Get moderation logs
      queries.push(`
        SELECT 
          'moderation' as type,
          action,
          target_user_id as target,
          moderator_id as moderator,
          reason,
          created_at as timestamp,
          CONCAT('Moderation: ', action, COALESCE(' - ' || reason, '')) as details
        FROM moderation_logs
        ORDER BY created_at DESC
        LIMIT 20
      `);

      // Get command usage logs
      queries.push(`
        SELECT 
          'commands' as type,
          command_name as action,
          user_id as target,
          NULL as moderator,
          NULL as reason,
          used_at as timestamp,
          CONCAT('Command: /', command_name) as details
        FROM command_stats
        ORDER BY used_at DESC
        LIMIT 20
      `);

      let allLogs = [];
      
      for (const query of queries) {
        try {
          const result = await db.query(query);
          allLogs = allLogs.concat(result.rows);
        } catch (error) {
          console.error('Error executing log query:', error);
        }
      }

      // Sort by timestamp and limit
      allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return allLogs.slice(0, limit);
    } catch (error) {
      console.error('Error getting server logs:', error);
      return [];
    }
  }

  async getLogsStats(guildId = 'current') {
    try {
      const stats = {};

      // Get moderation actions count
      const modQuery = 'SELECT COUNT(*) as count FROM moderation_logs';
      const modResult = await db.query(modQuery);
      stats.moderationActions = parseInt(modResult.rows[0]?.count || 0);
      stats.totalLogs = stats.moderationActions;

      // Get active warnings count
      const warnQuery = 'SELECT COUNT(*) as count FROM user_warnings WHERE is_active = true';
      const warnResult = await db.query(warnQuery);
      stats.activeWarnings = parseInt(warnResult.rows[0]?.count || 0);

      // Get commands today count
      const cmdQuery = 'SELECT COUNT(*) as count FROM command_stats WHERE DATE(used_at) = CURRENT_DATE';
      const cmdResult = await db.query(cmdQuery);
      stats.commandsToday = parseInt(cmdResult.rows[0]?.count || 0);

      return stats;
    } catch (error) {
      console.error('Error getting logs stats:', error);
      return {
        totalLogs: 0,
        moderationActions: 0,
        activeWarnings: 0,
        commandsToday: 0
      };
    }
  }

  async clearServerLogs(guildId) {
    try {
      const queries = [
        'DELETE FROM moderation_logs',
        'DELETE FROM command_stats',
        'UPDATE user_warnings SET is_active = false'
      ];

      for (const query of queries) {
        await db.query(query);
      }
    } catch (error) {
      console.error('Error clearing server logs:', error);
      throw error;
    }
  }
}

const storage = new DatabaseStorage();
module.exports = { storage };