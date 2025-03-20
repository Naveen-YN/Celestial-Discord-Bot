const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands'),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Command Help')
            .setColor(0x0099FF)
            .addFields(
                {
                    name: '🛡️ Moderation',
                    value: '`/kick` - Kick a user\n`/ban` - Ban a user\n`/timeout` - Timeout a user\n`/warn` - Warn a user\n`/purge` - Bulk delete messages'
                },
                {
                    name: '🔧 Utility',
                    value: '`/serverinfo` - Show server information\n`/userinfo` - Show user information\n`/avatar` - Show user avatar\n`/ping` - Check bot latency\n`/role` - Manage user roles\n`/channelinfo` - Show channel information'
                },
                {
                    name: '⚙️ Admin',
                    value: '`/welcome` - Set welcome message\n`/autorole` - Configure auto roles\n`/announcement` - Create announcements\n`/lockdown` - Lock/unlock channels'
                },
                {
                    name: '🛠️ Tools',
                    value: '`/embed` - Create custom embed messages'
                }
            )
            .setFooter({ text: 'Use /help <command> for more information about a specific command' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};