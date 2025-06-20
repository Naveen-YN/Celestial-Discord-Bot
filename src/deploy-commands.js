const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Load environment variables from .env file
require('dotenv').config();

// Validate environment variables
if (!process.env.DISCORD_TOKEN) {
    console.error('❌ Error: DISCORD_TOKEN is not set in environment variables.');
    process.exit(1);
}
if (!process.env.CLIENT_ID) {
    console.error('❌ Error: CLIENT_ID is not set in environment variables.');
    process.exit(1);
}

console.log(`🔑 Loaded CLIENT_ID: ${process.env.CLIENT_ID}`);
console.log(`🔑 Loaded DISCORD_TOKEN: ${process.env.DISCORD_TOKEN.substring(0, 10)}...`); // Partial token for security

const commands = [];
const foldersPath = path.join(__dirname, 'commands');

try {
    if (!fs.existsSync(foldersPath)) {
        console.error(`❌ Error: Commands folder not found at ${foldersPath}`);
        process.exit(1);
    }

    const commandFolders = fs.readdirSync(foldersPath);
    console.log(`📁 Found ${commandFolders.length} command folders.`);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        if (!fs.statSync(commandsPath).isDirectory()) {
            console.warn(`⚠️ Skipping ${folder}: Not a directory.`);
            continue;
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        console.log(`📄 Found ${commandFiles.length} command files in ${folder} folder.`);

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const command = require(filePath);
                if ('data' in command && 'execute' in command && typeof command.data.toJSON === 'function') {
                    const commandData = command.data.toJSON();
                    commands.push(commandData);
                    console.log(`✅ Loaded command: ${commandData.name} from ${filePath}`);
                } else {
                    console.warn(`⚠️ Skipping ${file}: Missing or invalid 'data' or 'execute' properties.`);
                }
            } catch (error) {
                console.error(`❌ Error loading command ${filePath}:`, error.message, error.stack);
            }
        }
    }
} catch (error) {
    console.error('❌ Error reading commands directory:', error.message, error.stack);
    process.exit(1);
}

if (commands.length === 0) {
    console.error('❌ Error: No valid commands found to register.');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);

        // Log commands with role restrictions
        try {
            const rolePermissionsPath = path.join(__dirname, 'utils', 'rolePermissions.js');
            if (fs.existsSync(rolePermissionsPath)) {
                const { COMMAND_PERMISSIONS, getRoleLevelName } = require(rolePermissionsPath);
                if (COMMAND_PERMISSIONS && typeof getRoleLevelName === 'function') {
                    console.log('\n📜 Commands with role restrictions:');
                    Object.entries(COMMAND_PERMISSIONS).forEach(([command, level]) => {
                        if (level > 0) {
                            console.log(`  /${command} - Requires: ${getRoleLevelName(level)}`);
                        }
                    });
                } else {
                    console.warn('⚠️ rolePermissions.js does not export valid COMMAND_PERMISSIONS or getRoleLevelName.');
                }
            } else {
                console.warn('⚠️ rolePermissions.js not found at:', rolePermissionsPath);
            }
        } catch (error) {
            console.error('❌ Error loading role permissions:', error.message, error.stack);
        }
    } catch (error) {
        console.error('❌ Error deploying commands:', error.message, error.stack);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.error('🌐 Network error: Check your internet connection or Discord API status.');
        } else if (error.status === 401) {
            console.error('🔑 Unauthorized: Verify DISCORD_TOKEN is correct.');
        } else if (error.status === 403) {
            console.error('🚫 Forbidden: Ensure CLIENT_ID is correct and bot has permissions.');
        } else if (error.status === 429) {
            console.error('⏳ Rate limited: Wait and try again later.');
        }
    }
})();