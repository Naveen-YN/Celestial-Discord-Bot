const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands'),

    async execute(interaction) {
        // Generate a random embed color
        const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;

        const embed = new EmbedBuilder()
            .setTitle('📜 Command Help')
            .setColor(randomColor)
            .setDescription(
                "Welcome to the **Celestial Bot Command Guide**!\n" +
                "Use `/help <command>` for more details on a specific command.\n\n" +
                "**Available Categories:**"
            )
            .addFields(
                {
                    name: '🛡️ Moderation',
                    value: 
                        '   ✦ `/kick` - Kick a user from the server\n' +
                        '   ✦ `/ban` - Ban a user permanently\n' +
                        '   ✦ `/timeout` - Temporarily mute a user\n' +
                        '   ✦ `/warn` - Issue a warning\n' +
                        '   ✦ `/purge` - Bulk delete messages',
                },
                {
                    name: '🔧 Utility',
                    value: 
                        '   ✦ `/serverinfo` - Get server details\n' +
                        '   ✦ `/userinfo` - Get user details\n' +
                        '   ✦ `/avatar` - View a user’s avatar\n' +
                        '   ✦ `/ping` - Check bot latency\n' +
                        '   ✦ `/role` - Manage user roles\n' +
                        '   ✦ `/channelinfo` - Get channel details',
                },
                {
                    name: '⚙️ Admin',
                    value: 
                        '   ✦ `/welcome` - Set a welcome message\n' +
                        '   ✦ `/autorole` - Configure auto roles\n' +
                        '   ✦ `/announcement` - Create an announcement\n' +
                        '   ✦ `/lockdown` - Lock/unlock a channel',
                },
                {
                    name: '🛠️ Tools',
                    value: 
                        '   ✦ `/embed` - Create custom embed messages',
                }
            )
            .setFooter({ text: 'Use /help <command> for more details | Celestial Bot' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
