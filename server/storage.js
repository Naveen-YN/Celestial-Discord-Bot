// File: /home/neuropia/Celestial-Discord-Bot/server/storage.js
const { pool } = require('./db.js');

class DatabaseStorage {
  // Guild operations
  async upsertGuild(guildData) {
    const query = `
      INSERT INTO guilds (id, name, icon_url, owner_id, member_count, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (id) DO UPDATE
      SET name = $2, icon_url = $3, owner_id = $4, member_count = $5, updated_at = NOW()
      RETURNING *;
    `;
    const values = [
      guildData.id,
      guildData.name || null,
      guildData.iconUrl || null,
      guildData.ownerId || null,
      guildData.memberCount || 0,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getGuild(guildId) {
    const query = 'SELECT * FROM guilds WHERE id = $1';
    const result = await pool.query(query, [guildId]);
    return result.rows[0] || null;
  }

  async getAllGuilds() {
    const query = 'SELECT * FROM guilds';
    const result = await pool.query(query);
    return result.rows;
  }

  // Welcome config operations
  async getWelcomeConfig(guildId) {
    const query = 'SELECT * FROM welcome_configs WHERE guild_id = $1';
    const result = await pool.query(query, [guildId]);
    return result.rows[0] || null;
  }

  async upsertWelcomeConfig(configData) {
    const existing = await this.getWelcomeConfig(configData.guildId);
    if (existing) {
      const query = `
        UPDATE welcome_configs
        SET channel_id = $2, is_enabled = $3, style = $4, message = $5, color = $6, updated_at = NOW()
        WHERE guild_id = $1
        RETURNING *;
      `;
      const values = [
        configData.guildId,
        configData.channelId,
        configData.isEnabled,
        configData.style,
        configData.message,
        configData.color,
      ];
      const result = await pool.query(query, values);
      return result.rows[0];
    } else {
      const query = `
        INSERT INTO welcome_configs (guild_id, channel_id, is_enabled, style, message, color, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *;
      `;
      const values = [
        configData.guildId,
        configData.channelId,
        configData.isEnabled,
        configData.style,
        configData.message,
        configData.color,
      ];
      const result = await pool.query(query, values);
      return result.rows[0];
    }
  }

  async disableWelcomeConfig(guildId) {
    const query = `
      UPDATE welcome_configs
      SET is_enabled = false, updated_at = NOW()
      WHERE guild_id = $1;
    `;
    await pool.query(query, [guildId]);
  }

  // Bot settings operations
  async getBotSettings() {
    const query = 'SELECT * FROM bot_settings LIMIT 1';
    const result = await pool.query(query);
    return result.rows[0] || null;
  }

  async upsertBotSettings(settingsData) {
    const existing = await this.getBotSettings();
    if (existing) {
      const query = `
        UPDATE bot_settings
        SET status = $1, activity_type = $2, activity_text = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *;
      `;
      const values = [
        settingsData.status || 'online',
        settingsData.activityType || 'playing',
        settingsData.activityText || 'Discord Bot Dashboard',
        existing.id,
      ];
      const result = await pool.query(query, values);
      return result.rows[0];
    } else {
      const query = `
        INSERT INTO bot_settings (status, activity_type, activity_text, updated_at)
        VALUES ($1, $2, $3, NOW())
        RETURNING *;
      `;
      const values = [
        settingsData.status || 'online',
        settingsData.activityType || 'playing',
        settingsData.activityText || 'Discord Bot Dashboard',
      ];
      const result = await pool.query(query, values);
      return result.rows[0];
    }
  }

  // Embed template operations (partial example)
  async saveEmbedTemplate(templateData) {
    const query = `
      INSERT INTO embed_templates (guild_id, title, description, color, fields, image_url, thumbnail_url, footer_text, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;
    const values = [
      templateData.guildId || null,
      templateData.title || null,
      templateData.description || null,
      templateData.color || null,
      JSON.stringify(templateData.fields) || null,
      templateData.imageUrl || null,
      templateData.thumbnailUrl || null,
      templateData.footerText || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getEmbedTemplates(guildId) {
    const query = guildId
      ? 'SELECT * FROM embed_templates WHERE guild_id = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM embed_templates ORDER BY created_at DESC';
    const result = await pool.query(query, guildId ? [guildId] : []);
    return result.rows;
  }

  async deleteEmbedTemplate(templateId) {
    const query = 'DELETE FROM embed_templates WHERE id = $1';
    await pool.query(query, [templateId]);
  }

  // Moderation log operations
  async addModerationLog(logData) {
    const query = `
      INSERT INTO moderation_logs (guild_id, action, target_user_id, moderator_id, reason, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const values = [
      logData.guildId,
      logData.action,
      logData.targetUserId,
      logData.moderatorId,
      logData.reason || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getModerationLogs(guildId, limit = 50) {
    const query = `
      SELECT * FROM moderation_logs
      WHERE guild_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    const result = await pool.query(query, [guildId, limit]);
    return result.rows;
  }

  // User warnings operations
  async addUserWarning(warningData) {
    const query = `
      INSERT INTO user_warnings (guild_id, user_id, moderator_id, reason, created_at, is_active)
      VALUES ($1, $2, $3, $4, NOW(), true)
      RETURNING *;
    `;
    const values = [
      warningData.guildId,
      warningData.userId,
      warningData.moderatorId,
      warningData.reason || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getUserWarnings(guildId, userId) {
    const query = `
      SELECT * FROM user_warnings
      WHERE guild_id = $1 AND user_id = $2 AND is_active = true
      ORDER BY created_at DESC;
    `;
    const result = await pool.query(query, [guildId, userId]);
    return result.rows;
  }

  async removeUserWarning(warningId) {
    const query = `
      UPDATE user_warnings
      SET is_active = false
      WHERE id = $1;
    `;
    await pool.query(query, [warningId]);
  }

  // Auto-role operations
  async upsertAutoRoleConfig(configData) {
    const query = `
      INSERT INTO auto_role_configs (guild_id, role_id, is_enabled, created_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (guild_id, role_id) DO UPDATE
      SET is_enabled = $3, updated_at = NOW()
      RETURNING *;
    `;
    const values = [configData.guildId, configData.roleId, configData.isEnabled];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getAutoRoleConfigs(guildId) {
    const query = `
      SELECT * FROM auto_role_configs
      WHERE guild_id = $1 AND is_enabled = true;
    `;
    const result = await pool.query(query, [guildId]);
    return result.rows;
  }

  // Command statistics
  async recordCommandUsage(commandData) {
    const query = `
      INSERT INTO command_stats (guild_id, user_id, command_name, used_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *;
    `;
    const values = [
      commandData.guildId,
      commandData.userId,
      commandData.commandName,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  async getCommandStats(guildId, days = 30) {
    const query = `
      SELECT command_name, COUNT(*) as count
      FROM command_stats
      WHERE guild_id = $1 AND used_at >= NOW() - ($2 * INTERVAL '1 day')
      GROUP BY command_name
      ORDER BY count DESC;
    `;
    const result = await pool.query(query, [guildId, days]);
    return result.rows;
  }


  // Dashboard stats
  async getDashboardStats(guildId) {
    const stats = {};
    if (guildId) {
      const guildQuery = 'SELECT * FROM guilds WHERE id = $1';
      const modQuery = 'SELECT COUNT(*) as count FROM moderation_logs WHERE guild_id = $1';
      const warnQuery = 'SELECT COUNT(*) as count FROM user_warnings WHERE guild_id = $1 AND is_active = true';

      const guildResult = await pool.query(guildQuery, [guildId]);
      const modResult = await pool.query(modQuery, [guildId]);
      const warnResult = await pool.query(warnQuery, [guildId]);

      stats.guild = guildResult.rows[0];
      stats.moderationActions = parseInt(modResult.rows[0].count) || 0;
      stats.activeWarnings = parseInt(warnResult.rows[0].count) || 0;
    } else {
      const totalGuildsQuery = 'SELECT COUNT(*) as count FROM guilds';
      const totalModQuery = 'SELECT COUNT(*) as count FROM moderation_logs';
      const totalWarnQuery = 'SELECT COUNT(*) as count FROM user_warnings WHERE is_active = true';

      const guildsResult = await pool.query(totalGuildsQuery);
      const modResult = await pool.query(totalModQuery);
      const warnResult = await pool.query(totalWarnQuery);

      stats.totalGuilds = parseInt(guildsResult.rows[0].count) || 0;
      stats.totalModerationActions = parseInt(modResult.rows[0].count) || 0;
      stats.totalActiveWarnings = parseInt(warnResult.rows[0].count) || 0;
    }
    return stats;
  }

  // Custom Commands Management
  async createCustomCommand(commandData) {
    const query = `
      INSERT INTO custom_commands (guild_id, command_name, description, response, response_type, embed_data, permissions, created_by, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *;
    `;
    const values = [
      commandData.guildId || null,
      commandData.commandName,
      commandData.description || null,
      commandData.response,
      commandData.responseType || 'text',
      commandData.embedData ? JSON.stringify(commandData.embedData) : null,
      commandData.permissions || 'everyone',
      commandData.createdBy,
    ];
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      embedData: row.embed_data ? JSON.parse(row.embed_data) : null,
    };
  }

  async getCustomCommands(guildId) {
    const query = 'SELECT * FROM custom_commands ORDER BY created_at DESC LIMIT 20';
    const result = await pool.query(query);
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
      updatedAt: row.updated_at,
    }));
  }

  async getCustomCommand(commandName, guildId) {
    const query = 'SELECT * FROM custom_commands WHERE command_name = $1 LIMIT 1';
    const result = await pool.query(query, [commandName]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...row,
      embedData: row.embed_data ? JSON.parse(row.embed_data) : null,
    };
  }

  async updateCustomCommand(id, updates) {
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
      RETURNING *;
    `;
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      embedData: row.embed_data ? JSON.parse(row.embed_data) : null,
    };
  }

  async deleteCustomCommand(id) {
    const query = 'DELETE FROM custom_commands WHERE id = $1';
    await pool.query(query, [id]);
  }

  async incrementCommandUsage(commandName, guildId) {
    const query = 'UPDATE custom_commands SET usage_count = usage_count + 1 WHERE command_name = $1';
    await pool.query(query, [commandName]);
  }

  // Bot Messages Management
  async saveBotMessage(messageData) {
    const query = `
      INSERT INTO bot_messages (guild_id, channel_id, message_id, message_type, content, embed_data, sent_by, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *;
    `;
    const values = [
      messageData.guildId,
      messageData.channelId,
      messageData.messageId,
      messageData.messageType,
      messageData.content,
      messageData.embedData ? JSON.stringify(messageData.embedData) : null,
      messageData.sentBy,
    ];
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      embedData: row.embed_data ? JSON.parse(row.embed_data) : null,
    };
  }

  async getBotMessages(guildId = 'current', limit = 50) {
    const query = `
      SELECT * FROM bot_messages
      WHERE is_deleted = false
      ORDER BY sent_at DESC
      LIMIT $1;
    `;
    const result = await pool.query(query, [limit]);
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
      isDeleted: row.is_deleted,
    }));
  }

  async getBotMessage(messageId) {
    const query = 'SELECT * FROM bot_messages WHERE message_id = $1';
    const result = await pool.query(query, [messageId]);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return {
      ...row,
      embedData: row.embed_data ? JSON.parse(row.embed_data) : null,
    };
  }

  async updateBotMessage(messageId, updates) {
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
      RETURNING *;
    `;
    const result = await pool.query(query, values);
    const row = result.rows[0];
    return {
      ...row,
      embedData: row.embed_data ? JSON.parse(row.embed_data) : null,
    };
  }

  async deleteBotMessage(messageId) {
    const query = 'UPDATE bot_messages SET is_deleted = true WHERE message_id = $1';
    await pool.query(query, [messageId]);
  }

  // Server Logs Management
  async getServerLogs(guildId = 'current', type = 'all', date = null, limit = 100) {
    let allLogs = [];
    const queries = [
      `
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
      `,
      `
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
      `,
    ];

    for (const query of queries) {
      try {
        const result = await pool.query(query);
        allLogs = allLogs.concat(result.rows);
      } catch (error) {
        console.error('Error executing log query:', error);
      }
    }

    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return allLogs.slice(0, limit);
  }

  async getLogsStats(guildId = 'current') {
    const stats = {};
    const modQuery = 'SELECT COUNT(*) as count FROM moderation_logs';
    const warnQuery = 'SELECT COUNT(*) as count FROM user_warnings WHERE is_active = true';
    const cmdQuery = 'SELECT COUNT(*) as count FROM command_stats WHERE DATE(used_at) = CURRENT_DATE';

    const modResult = await pool.query(modQuery);
    const warnResult = await pool.query(warnQuery);
    const cmdResult = await pool.query(cmdQuery);

    stats.moderationActions = parseInt(modResult.rows[0]?.count) || 0;
    stats.activeWarnings = parseInt(warnResult.rows[0]?.count) || 0;
    stats.commandsToday = parseInt(cmdResult.rows[0]?.count) || 0;
    stats.totalLogs = stats.moderationActions;

    return stats;
  }

  async clearServerLogs(guildId) {
    const queries = [
      'DELETE FROM moderation_logs',
      'DELETE FROM command_stats',
      'UPDATE user_warnings SET is_active = false',
    ];
    for (const query of queries) {
      await pool.query(query);
    }
  }
}

const storage = new DatabaseStorage();
module.exports = { storage };
