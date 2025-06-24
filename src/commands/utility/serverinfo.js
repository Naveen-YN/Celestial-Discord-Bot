const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('📑 Display detailed information about the server'),

    async execute(interaction) {
        const { guild } = interaction;

        // Fetch fresh owner data (for bots without cached ownerId)
        const owner = await guild.fetchOwner();

        // Random pastel color
        const color = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;

        const createdDate = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`; // Discord timestamp format

        const embed = new EmbedBuilder()
            .setTitle(`📊 Server Information: ${guild.name}`)
            .setColor(color)
            .setThumbnail(guild.iconURL({ size: 1024, dynamic: true }))
            .addFields(
                {
                    name: '👑 Owner',
                    value: `${owner.user.tag} (<@${owner.id}>)`,
                    inline: true
                },
                {
                    name: '🆔 Server ID',
                    value: `\`${guild.id}\``,
                    inline: true
                },
                {
                    name: '📅 Created On',
                    value: `${createdDate}`,
                    inline: true
                },
                {
                    name: '👥 Members',
                    value: `${guild.memberCount.toLocaleString()}`,
                    inline: true
                },
                {
                    name: '📣 Channels',
                    value: `${guild.channels.cache.filter(c => !c.isThread()).size}`,
                    inline: true
                },
                {
                    name: '🎭 Roles',
                    value: `${guild.roles.cache.size}`,
                    inline: true
                },
                {
                    name: '🚀 Boost Tier',
                    value: `Level ${guild.premiumTier || '0'}`,
                    inline: true
                },
                {
                    name: '💎 Boosts',
                    value: `${guild.premiumSubscriptionCount || 0}`,
                    inline: true
                },
                {
                    name: '🛡️ Verification Level',
                    value: `${guild.verificationLevel}`,
                    inline: true
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
