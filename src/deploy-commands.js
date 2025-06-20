const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

// Ensure environment variables are set
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    console.error('Error: DISCORD_TOKEN or CLIENT_ID is not set in environment variables.');
    process.exit(1);
}

const commands = [];
const foldersPath = path.join(__dirname, 'commands');

try {
    const commandFolders = fs.readdirSync(foldersPath);

    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        // Verify folder is a directory
        if (!fs.statSync(commandsPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            try {
                const command = require(filePath);

                // Validate command structure
                if ('data' in command && 'execute' in command && command.data?.toJSON) {
                    commands.push(command.data.toJSON());
                } else {
                    console.warn(`Warning: Command at ${filePath} is missing required 'data' or 'execute' properties or invalid data structure.`);
                }
            } catch (error) {
                console.error(`Error loading command at ${filePath}:`, error.message);
            }
        }
    }
} catch (error) {
    console.error('Error reading commands directory:', error.message);
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);

        // Log commands with role restrictions
        try {
            const { COMMAND_PERMISSIONS, getRoleLevelName } = require('./utils/rolePermissions.js');
            if (COMMAND_PERMISSIONS && getRoleLevelName) {
                console.log('\nCommands with role restrictions:');
                Object.entries(COMMAND_PERMISSIONS).forEach(([command, level]) => {
                    if (level > 0) {
                        console.log(`  /${command} - Requires: ${getRoleLevelName(level)}`);
                    }
                });
            }
        } catch (error) {
            console.error('Error loading role permissions:', error.message);
        }
    } catch (error) {
        console.error('Error deploying commands:', error.message);
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            console.error('Network error: Check your internet connection or Discord API availability.');
        } else if (error.status === 401) {
            console.error('Unauthorized: Verify your DISCORD_TOKEN is correct.');
        } else if (error.status === 403) {
            console.error('Forbidden: Ensure the bot has proper permissions and CLIENT_ID is correct.');
        }
    }
})();