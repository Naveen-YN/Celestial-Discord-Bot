const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('refresh')
        .setDescription('Refresh all slash commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            // Collect all commands
            const commands = [];
            const foldersPath = path.join(__dirname, '..');
            const commandFolders = fs.readdirSync(foldersPath);

            for (const folder of commandFolders) {
                const commandsPath = path.join(foldersPath, folder);
                const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
                
                for (const file of commandFiles) {
                    const filePath = path.join(commandsPath, file);
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    
                    if ('data' in command && 'execute' in command) {
                        commands.push(command.data.toJSON());
                    }
                }
            }

            const rest = new REST().setToken(process.env.DISCORD_TOKEN);

            // Refresh application commands
            const data = await rest.put(
                Routes.applicationCommands(process.env.CLIENT_ID),
                { body: commands },
            );

            await interaction.editReply({
                content: `Successfully reloaded ${data.length} application (/) commands!`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: 'There was an error while refreshing commands!',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};
