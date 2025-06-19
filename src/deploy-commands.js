const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            commands.push(command.data.toJSON());
        }
    }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

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
            console.log('\nCommands with role restrictions:');
            
            Object.entries(COMMAND_PERMISSIONS).forEach(([command, level]) => {
                if (level > 0) {
                    console.log(`  /${command} - Requires: ${getRoleLevelName(level)}`);
                }
            });
        } catch (error) {
            console.error('Error loading role permissions:', error);
        }
    } catch (error) {
        console.error(error);
    }
})();
