import { pgTable, serial, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Guilds table - stores server configurations
export const guilds = pgTable('guilds', {
  id: text('id').primaryKey(), // Discord guild ID
  name: text('name').notNull(),
  iconUrl: text('icon_url'),
  ownerId: text('owner_id').notNull(),
  memberCount: integer('member_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Welcome configurations table
export const welcomeConfigs = pgTable('welcome_configs', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
  channelId: text('channel_id').notNull(),
  isEnabled: boolean('is_enabled').default(true),
  style: text('style').notNull().default('embed_basic'), // text, embed_basic, embed_advanced
  message: text('message').notNull(),
  color: text('color').default('#0099ff'),
  imageUrl: text('image_url'),
  thumbnailUrl: text('thumbnail_url'),
  footerText: text('footer_text'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Bot settings table
export const botSettings = pgTable('bot_settings', {
  id: serial('id').primaryKey(),
  status: text('status').notNull().default('online'), // online, idle, dnd, invisible
  activityType: text('activity_type').default('playing'), // playing, streaming, listening, watching
  activityText: text('activity_text').default('Discord Bot Dashboard'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Embed templates table - for saving custom embeds
export const embedTemplates = pgTable('embed_templates', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  guildId: text('guild_id').references(() => guilds.id, { onDelete: 'cascade' }),
  embedData: jsonb('embed_data').notNull(), // Store entire embed configuration as JSON
  createdBy: text('created_by'), // User ID who created it
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Moderation logs table
export const moderationLogs = pgTable('moderation_logs', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
  moderatorId: text('moderator_id').notNull(),
  targetUserId: text('target_user_id').notNull(),
  action: text('action').notNull(), // ban, kick, timeout, warn, purge
  reason: text('reason'),
  duration: integer('duration'), // For timeouts (in seconds)
  messageCount: integer('message_count'), // For purge actions
  createdAt: timestamp('created_at').defaultNow(),
});

// User warnings table
export const userWarnings = pgTable('user_warnings', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  moderatorId: text('moderator_id').notNull(),
  reason: text('reason').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Auto-role configurations
export const autoRoleConfigs = pgTable('auto_role_configs', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').notNull().references(() => guilds.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull(),
  isEnabled: boolean('is_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Command usage statistics
export const commandStats = pgTable('command_stats', {
  id: serial('id').primaryKey(),
  guildId: text('guild_id').references(() => guilds.id, { onDelete: 'cascade' }),
  commandName: text('command_name').notNull(),
  userId: text('user_id').notNull(),
  usedAt: timestamp('used_at').defaultNow(),
});

// Relations
export const guildsRelations = relations(guilds, ({ many }) => ({
  welcomeConfigs: many(welcomeConfigs),
  embedTemplates: many(embedTemplates),
  moderationLogs: many(moderationLogs),
  userWarnings: many(userWarnings),
  autoRoleConfigs: many(autoRoleConfigs),
  commandStats: many(commandStats),
}));

export const welcomeConfigsRelations = relations(welcomeConfigs, ({ one }) => ({
  guild: one(guilds, {
    fields: [welcomeConfigs.guildId],
    references: [guilds.id],
  }),
}));

export const embedTemplatesRelations = relations(embedTemplates, ({ one }) => ({
  guild: one(guilds, {
    fields: [embedTemplates.guildId],
    references: [guilds.id],
  }),
}));

export const moderationLogsRelations = relations(moderationLogs, ({ one }) => ({
  guild: one(guilds, {
    fields: [moderationLogs.guildId],
    references: [guilds.id],
  }),
}));

export const userWarningsRelations = relations(userWarnings, ({ one }) => ({
  guild: one(guilds, {
    fields: [userWarnings.guildId],
    references: [guilds.id],
  }),
}));

export const autoRoleConfigsRelations = relations(autoRoleConfigs, ({ one }) => ({
  guild: one(guilds, {
    fields: [autoRoleConfigs.guildId],
    references: [guilds.id],
  }),
}));

export const commandStatsRelations = relations(commandStats, ({ one }) => ({
  guild: one(guilds, {
    fields: [commandStats.guildId],
    references: [guilds.id],
  }),
}));

// TypeScript types
export type Guild = typeof guilds.$inferSelect;
export type InsertGuild = typeof guilds.$inferInsert;

export type WelcomeConfig = typeof welcomeConfigs.$inferSelect;
export type InsertWelcomeConfig = typeof welcomeConfigs.$inferInsert;

export type BotSettings = typeof botSettings.$inferSelect;
export type InsertBotSettings = typeof botSettings.$inferInsert;

export type EmbedTemplate = typeof embedTemplates.$inferSelect;
export type InsertEmbedTemplate = typeof embedTemplates.$inferInsert;

export type ModerationLog = typeof moderationLogs.$inferSelect;
export type InsertModerationLog = typeof moderationLogs.$inferInsert;

export type UserWarning = typeof userWarnings.$inferSelect;
export type InsertUserWarning = typeof userWarnings.$inferInsert;

export type AutoRoleConfig = typeof autoRoleConfigs.$inferSelect;
export type InsertAutoRoleConfig = typeof autoRoleConfigs.$inferInsert;

export type CommandStat = typeof commandStats.$inferSelect;
export type InsertCommandStat = typeof commandStats.$inferInsert;

export type CustomCommand = typeof customCommands.$inferSelect;
export type InsertCustomCommand = typeof customCommands.$inferInsert;

export type BotMessage = typeof botMessages.$inferSelect;
export type InsertBotMessage = typeof botMessages.$inferInsert;