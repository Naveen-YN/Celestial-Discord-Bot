# Discord Bot Dashboard Project

## Overview
A comprehensive Discord bot similar to MEE6 and Dyno with advanced features including moderation commands, utility functions, administrative tools, and a web-based dashboard for bot management.

## Current Status
- ✅ Discord bot with 19+ slash commands across multiple categories
- ✅ Express server running on port 5000
- ✅ Web dashboard with embed builder and bot management features
- ✅ Real-time bot statistics and activity monitoring
- ✅ Welcome message configuration system
- ✅ Canvas integration for custom welcome images

## Features

### Discord Bot Commands
- **Administration**: announcement, autorole, lockdown, welcome, refresh
- **Moderation**: ban, kick, timeout, warn, purge
- **Utility**: ping, help, avatar, userinfo, serverinfo, channelinfo, role, stats
- **Tools**: embed builder

### Web Dashboard
- **Overview**: Real-time bot statistics, server count, user count, uptime
- **Embed Builder**: Visual embed creator with live preview, field management, export functionality
- **Welcome Configuration**: Custom welcome messages with variable support
- **Command Management**: View all available commands by category
- **Settings**: Bot presence, activity, and permission management

## Recent Changes
- 2025-06-19: Created comprehensive web dashboard with modern UI
- 2025-06-19: Integrated Express server with static file serving
- 2025-06-19: Added API endpoints for bot management and configuration
- 2025-06-19: Implemented real-time embed preview functionality
- 2025-06-19: Added welcome message configuration interface
- 2025-06-19: Integrated PostgreSQL database with Drizzle ORM
- 2025-06-19: Created database schemas for guilds, welcome configs, bot settings
- 2025-06-19: Added persistent storage for all bot configurations
- 2025-06-19: Enhanced moderation commands with database logging
- 2025-06-19: Added command usage tracking and analytics
- 2025-06-19: Implemented embed template save/load functionality
- 2025-06-19: Added visual command usage statistics

## Technical Architecture
- **Backend**: Node.js with Discord.js v14+ and Express
- **Frontend**: Vanilla HTML/CSS/JavaScript with modern design
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations
- **APIs**: RESTful endpoints for dashboard communication
- **Styling**: Custom CSS with dark theme and responsive design
- **Storage**: Persistent storage for configurations, logs, and statistics

## User Preferences
- Focus on MEE6-style functionality
- Custom welcome images using canvas
- Professional, modern web interface
- Real-time preview capabilities
- Easy-to-use configuration tools

## Next Steps
- Canvas integration for custom welcome images
- Advanced moderation features with database logging
- Auto-moderation system with configurable rules
- Analytics dashboard with command usage statistics
- Backup and restore functionality for configurations