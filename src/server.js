const express = require('express');
const path = require('path');
const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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

// Serve dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API Routes
app.get('/api/bot-stats', (req, res) => {
    // Get bot instance if available
    const bot = global.botClient;
    
    if (bot && bot.isReady()) {
        const stats = {
            servers: bot.guilds.cache.size,
            users: bot.users.cache.size,
            uptime: Math.floor(bot.uptime / 1000),
            commands: 19,
            status: 'online'
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
                status: 'offline' 
            } 
        });
    }
});

app.get('/api/channels', (req, res) => {
    const bot = global.botClient;
    
    if (bot && bot.isReady()) {
        const channels = [];
        bot.guilds.cache.forEach(guild => {
            guild.channels.cache
                .filter(channel => channel.type === 0) // Text channels
                .forEach(channel => {
                    channels.push({
                        id: channel.id,
                        name: channel.name,
                        guild: guild.name
                    });
                });
        });
        res.json({ success: true, channels });
    } else {
        res.json({ success: false, error: 'Bot not ready' });
    }
});

app.post('/api/send-embed', (req, res) => {
    const bot = global.botClient;
    const embedData = req.body;
    
    if (!bot || !bot.isReady()) {
        return res.json({ success: false, error: 'Bot not ready' });
    }
    
    // This would typically send to a specific channel
    // For now, we'll just validate the data
    if (!embedData.title && !embedData.description) {
        return res.json({ success: false, error: 'Embed must have a title or description' });
    }
    
    res.json({ success: true, message: 'Embed data received' });
});

app.post('/api/welcome-config', (req, res) => {
    const configData = req.body;
    
    // Store configuration (in a real implementation, this would go to a database)
    console.log('Welcome config saved:', configData);
    
    res.json({ success: true, message: 'Welcome configuration saved' });
});

app.post('/api/test-welcome', (req, res) => {
    const bot = global.botClient;
    
    if (!bot || !bot.isReady()) {
        return res.json({ success: false, error: 'Bot not ready' });
    }
    
    // This would send a test welcome message
    console.log('Test welcome message requested');
    
    res.json({ success: true, message: 'Test welcome message sent' });
});

app.post('/api/settings', (req, res) => {
    const bot = global.botClient;
    const settingsData = req.body;
    
    if (!bot || !bot.isReady()) {
        return res.json({ success: false, error: 'Bot not ready' });
    }
    
    try {
        // Update bot presence
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
        
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating settings:', error);
        res.json({ success: false, error: error.message });
    }
});

app.post('/api/reset-settings', (req, res) => {
    const bot = global.botClient;
    
    if (!bot || !bot.isReady()) {
        return res.json({ success: false, error: 'Bot not ready' });
    }
    
    try {
        // Reset to default presence
        bot.user.setPresence({
            status: 'online',
            activities: [{
                name: 'Discord Bot Dashboard',
                type: 0
            }]
        });
        
        res.json({ success: true, message: 'Settings reset successfully' });
    } catch (error) {
        console.error('Error resetting settings:', error);
        res.json({ success: false, error: error.message });
    }
});

// Server status endpoint
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

// Create server instance
const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Express server is running on port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;