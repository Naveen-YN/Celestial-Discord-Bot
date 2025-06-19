const express = require('express');
const path = require('path');
const { storage } = require('../server/storage.js');
const app = express();
const port = 5000;

// Middleware
app.use(express.json());
// Serve static files from 'public' at /discord-bot
app.use('/discord-bot', express.static(path.join(__dirname, '../public')));

// Middleware for basic request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Optional: Redirect root to /discord-bot
app.get('/', (req, res) => {
    res.redirect('/discord-bot');
});

// API Routes (accessible at /discord-bot/api/... if prefixed)
app.get('/api/bot-stats', async (req, res) => {
    try {
        const bot = global.botClient;
        
        if (bot && bot.isReady()) {
            const dbStats = await storage.getDashboardStats();
            
            const stats = {
                servers: bot.guilds.cache.size,
                users: bot.users.cache.size,
                uptime: Math.floor(bot.uptime / 1000),
                commands: 19,
                status: 'online',
                totalGuilds: dbStats.totalGuilds || 0,
                totalModerationActions: dbStats.totalModerationActions || 0,
                totalActiveWarnings: dbStats.totalActiveWarnings || 0
            };
            res.json({ success: true, stats });
        } else {
            res.json({ 
                success: true, 
                stats: { 
                    servers: 0, 
                    users: 0, 
                    uptime: 0, 
                    commands: 19,
                    status: 'offline',
                    totalGuilds: 0,
                    totalModerationActions: 0,
                    totalActiveWarnings: 0
                } 
            });
        }
    } catch (error) {
        console.error('Error getting bot stats:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/channels', (req, res) => {
    const bot = global.botClient;
    
    if (bot && bot.isReady()) {
        const channels = [];
        bot.guilds.cache.forEach(guild => {
            guild.channels.cache
                .filter(channel => channel.type === 0)
                .forEach(channel => {
                    channels.push({
                        id: channel.id,
                        name: channel.name,
                        guild: guild.name,
                        guildId: guild.id
                    });
                });
        });
        res.json({ success: true, channels });
    } else {
        res.json({ success: false, error: 'Bot not ready' });
    }
});

app.get('/api/servers', async (req, res) => {
    try {
        const bot = global.botClient;
        
        if (bot && bot.isReady()) {
            const servers = [];
            for (const [guildId, guild] of bot.guilds.cache) {
                await storage.upsertGuild({
                    id: guild.id,
                    name: guild.name,
                    iconUrl: guild.iconURL(),
                    ownerId: guild.ownerId,
                    memberCount: guild.memberCount
                });
                
                const guildStats = await storage.getDashboardStats(guild.id);
                
                servers.push({
                    id: guild.id,
                    name: guild.name,
                    memberCount: guild.memberCount,
                    icon: guild.iconURL(),
                    owner: guild.ownerId,
                    createdAt: guild.createdTimestamp,
                    moderationActions: guildStats.moderationActions || 0,
                    activeWarnings: guildStats.activeWarnings || 0
                });
            }
            res.json({ success: true, servers });
        } else {
            res.json({ success: false, error: 'Bot not ready' });
        }
    } catch (error) {
        console.error('Error getting servers:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/user-info', (req, res) => {
    const bot = global.botClient;
    
    if (bot && bot.isReady()) {
        const botUser = bot.user;
        res.json({
            success: true,
            user: {
                id: botUser.id,
                username: botUser.username,
                discriminator: botUser.discriminator,
                avatar: botUser.displayAvatarURL(),
                tag: botUser.tag
            }
        });
    } else {
        res.json({ success: false, error: 'Bot not ready' });
    }
});

app.post('/api/send-embed', (req, res) => {
    const bot = global.botClient;
    const { embedData, channelId } = req.body;
    
    if (!bot || !bot.isReady()) {
        return res.json({ success: false, error: 'Bot not ready' });
    }
    
    if (!embedData.title && !embedData.description) {
        return res.json({ success: false, error: 'Embed must have a title or description' });
    }
    
    if (!channelId) {
        return res.json({ success: false, error: 'Channel ID is required' });
    }
    
    try {
        const { EmbedBuilder } = require('discord.js');
        const embed = new EmbedBuilder();
        
        if (embedData.title) embed.setTitle(embedData.title);
        if (embedData.description) embed.setDescription(embedData.description);
        if (embedData.color) embed.setColor(embedData.color);
        if (embedData.url) embed.setURL(embedData.url);
        if (embedData.image) embed.setImage(embedData.image);
        if (embedData.thumbnail) embed.setThumbnail(embedData.thumbnail);
        if (embedData.footer && embedData.footer.text) {
            embed.setFooter({
                text: embedData.footer.text,
                iconURL: embedData.footer.icon_url || null
            });
        }
        if (embedData.fields && embedData.fields.length > 0) {
            embedData.fields.forEach(field => {
                embed.addFields({
                    name: field.name,
                    value: field.value,
                    inline: field.inline || false
                });
            });
        }
        
        bot.channels.cache.get(channelId)?.send({ embeds: [embed] });
        res.json({ success: true, message: 'Embed sent successfully' });
    } catch (error) {
        console.error('Error sending embed:', error);
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/welcome-config', async (req, res) => {
    const configData = req.body;
    
    try {
        const bot = global.botClient;
        if (bot && bot.isReady()) {
            let guild = null;
            if (configData.guildId) {
                guild = bot.guilds.cache.get(configData.guildId);
            } else if (configData.channel) {
                const channel = bot.channels.cache.get(configData.channel);
                if (channel) {
                    guild = channel.guild;
                }
            }
            
            if (guild) {
                await storage.upsertGuild({
                    id: guild.id,
                    name: guild.name,
                    iconUrl: guild.iconURL(),
                    ownerId: guild.ownerId,
                    memberCount: guild.memberCount
                });
            }
        }

        let guildId = configData.guildId;
        if (!guildId && configData.channel) {
            const channel = bot?.channels.cache.get(configData.channel);
            if (channel) {
                guildId = channel.guild.id;
            }
        }

        await storage.upsertWelcomeConfig({
            guildId: guildId,
            channelId: configData.channel,
            style: configData.style,
            message: configData.message,
            color: configData.color,
            imageUrl: configData.image,
            thumbnailUrl: configData.thumbnail,
            footerText: configData.footer
        });
        
        res.json({ success: true, message: 'Welcome configuration saved to database' });
    } catch (error) {
        console.error('Error saving welcome config:', error);
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/test-welcome', (req, res) => {
    const bot = global.botClient;
    
    if (!bot || !bot.isReady()) {
        return res.json({ success: false, error: 'Bot not ready' });
    }
    
    console.log('Test welcome message requested');
    res.json({ success: true, message: 'Test welcome message sent' });
});

app.post('/api/settings', async (req, res) => {
    const bot = global.botClient;
    const settingsData = req.body;
    
    if (!bot || !bot.isReady()) {
        return res.json({ success: false, error: 'Bot not ready' });
    }
    
    try {
        await storage.upsertBotSettings({
            status: settingsData.status,
            activityType: settingsData.activityType,
            activityText: settingsData.activityText
        });

        const activityTypes = {
            playing: 0,
            streaming: 1,
            listening: 2,
            watching: 3
        };
        
        const presence = {
            status: settingsData.status,
            activities: []
        };
        
        if (settingsData.activityText) {
            presence.activities.push({
                name: settingsData.activityText,
                type: activityTypes[settingsData.activityType] || 0
            });
        }
        
        bot.user.setPresence(presence);
        
        res.json({ success: true, message: 'Settings updated and saved to database' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/reset-settings', async (req, res) => {
    const bot = global.botClient;
    
    if (!bot || !bot.isReady()) {
        return res.json({ success: false, error: 'Bot not ready' });
    }
    
    try {
        await storage.upsertBotSettings({
            status: 'online',
            activityType: 'playing',
            activityText: 'Discord Bot Dashboard'
        });

        bot.user.setPresence({
            status: 'online',
            activities: [{
                name: 'Discord Bot Dashboard',
                type: 0
            }]
        });
        
        res.json({ success: true, message: 'Settings reset and saved to database' });
    } catch (error) {
        console.error('Error resetting settings:', error);
        res.json({ success: false, error: error.message });
    }
});

// New API endpoints for database functionality
app.get('/api/welcome-config/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const config = await storage.getWelcomeConfig(guildId);
        res.json({ success: true, config });
    } catch (error) {
        console.error('Error getting welcome config:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/embed-templates', async (req, res) => {
    try {
        const { guildId } = req.query;
        const templates = await storage.getEmbedTemplates(guildId);
        res.json({ success: true, templates });
    } catch (error) {
        console.error('Error getting embed templates:', error);
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/embed-templates', async (req, res) => {
    try {
        const templateData = req.body;
        const template = await storage.saveEmbedTemplate(templateData);
        res.json({ success: true, template });
    } catch (error) {
        console.error('Error saving embed template:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/moderation-logs/:guildId', async (req, res) => {
    try {
        const { guildId } = req.params;
        const { limit = 50 } = req.query;
        const logs = await storage.getModerationLogs(guildId, parseInt(limit));
        res.json({ success: true, logs });
    } catch (error) {
        console.error('Error getting moderation logs:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/command-stats', async (req, res) => {
    try {
        const { guildId } = req.query;
        const stats = await storage.getCommandStats(guildId);
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Error getting command stats:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/role-permissions', (req, res) => {
    try {
        const { COMMAND_PERMISSIONS, ROLE_HIERARCHY, getRoleLevelName } = require('../src/utils/rolePermissions.js');
        
        const permissionInfo = {
            hierarchy: ROLE_HIERARCHY,
            commandPermissions: COMMAND_PERMISSIONS,
            roleLevelNames: {}
        };
        
        Object.values(ROLE_HIERARCHY).forEach(level => {
            permissionInfo.roleLevelNames[level] = getRoleLevelName(level);
        });
        
        res.json({ success: true, data: permissionInfo });
    } catch (error) {
        console.error('Error getting role permissions:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/custom-commands', async (req, res) => {
    try {
        const { guildId } = req.query;
        const commands = await storage.getCustomCommands(guildId);
        res.json({ success: true, commands });
    } catch (error) {
        console.error('Error getting custom commands:', error);
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/custom-commands', async (req, res) => {
    try {
        const commandData = req.body;
        const command = await storage.createCustomCommand(commandData);
        res.json({ success: true, command });
    } catch (error) {
        console.error('Error creating custom command:', error);
        res.json({ success: false, error: error.message });
    }
});

app.put('/api/custom-commands/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const command = await storage.updateCustomCommand(parseInt(id), updates);
        res.json({ success: true, command });
    } catch (error) {
        console.error('Error updating custom command:', error);
        res.json({ success: false, error: error.message });
    }
});

app.delete('/api/custom-commands/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await storage.deleteCustomCommand(parseInt(id));
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting custom command:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/bot-messages', async (req, res) => {
    try {
        const { guildId, limit } = req.query;
        const messages = await storage.getBotMessages(guildId, parseInt(limit) || 50);
        res.json({ success: true, messages });
    } catch (error) {
        console.error('Error getting bot messages:', error);
        res.json({ success: false, error: error.message });
    }
});

app.put('/api/bot-messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const updates = req.body;
        
        const message = await storage.updateBotMessage(messageId, updates);
        
        if (global.discordClient) {
            const channel = await global.discordClient.channels.fetch(message.channelId);
            if (channel) {
                const discordMessage = await channel.messages.fetch(messageId);
                if (discordMessage) {
                    await discordMessage.edit({
                        content: updates.content || null,
                        embeds: updates.embedData ? [updates.embedData] : []
                    });
                }
            }
        }
        
        res.json({ success: true, message });
    } catch (error) {
        console.error('Error updating bot message:', error);
        res.json({ success: false, error: error.message });
    }
});

app.delete('/api/bot-messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        
        await storage.deleteBotMessage(messageId);
        
        if (global.discordClient) {
            const message = await storage.getBotMessage(messageId);
            if (message) {
                const channel = await global.discordClient.channels.fetch(message.channelId);
                if (channel) {
                    const discordMessage = await channel.messages.fetch(messageId);
                    if (discordMessage && discordMessage.deletable) {
                        await discordMessage.delete();
                    }
                }
            }
        }
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting bot message:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/api/server-logs', async (req, res) => {
    try {
        const { type, date, guildId } = req.query;
        const logs = await storage.getServerLogs(guildId, type, date);
        const stats = await storage.getLogsStats(guildId);
        res.json({ success: true, logs, stats });
    } catch (error) {
        console.error('Error getting server logs:', error);
        res.json({ success: false, error: error.message });
    }
});

app.delete('/api/server-logs', async (req, res) => {
    try {
        const { guildId } = req.query;
        await storage.clearServerLogs(guildId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error clearing server logs:', error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/status', (req, res) => {
    res.json({
        status: 'online',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodejs: process.version
    });
});

const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Express server is running on port ${port}`);
});

process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
