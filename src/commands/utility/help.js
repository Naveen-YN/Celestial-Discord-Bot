const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('📜 Shows all available commands'),

    async execute(interaction) {
        const client = interaction.client;

        // Random pastel-like color
        const color = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;

        const embed = new EmbedBuilder()
            .setTitle('📜 Command Help')
            .setColor(color)
            .setThumbnail(client.user.displayAvatarURL({ size: 512, dynamic: true }))
            .setDescription([
                '**Welcome to the Celestial Bot Command Guide!**',
                '> Use `/help <command>` to get details on a specific command.\n',
                '**📂 Categories & Commands:**'
            ].join('\n'))
            .addFields(
                {
                    name: '🛡️ Moderation',
                    value: [
                        '> • `/kick` — Kick a user',
                        '> • `/ban` — Ban a user',
                        '> • `/timeout` — Temporarily mute a user',
                        '> • `/warn` — Issue a warning',
                        '> • `/purge` — Delete messages in bulk'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🔧 Utility',
                    value: [
                        '> • `/serverinfo` — View server details',
                        '> • `/userinfo` — View user info',
                        '> • `/avatar` — Get a user’s avatar',
                        '> • `/ping` — Check bot latency',
                        '> • `/role` — Manage roles',
                        '> • `/channelinfo` — View channel info'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚙️ Admin',
                    value: [
                        '> • `/welcome` — Set welcome messages',
                        '> • `/autorole` — Configure auto-roles',
                        '> • `/announcement` — Send announcements',
                        '> • `/lockdown` — Lock or unlock a channel'
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🛠️ Tools',
                    value: '> • `/embed` — Create a custom embed',
                    inline: false
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag} | Celestial Bot`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
