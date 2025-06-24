const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('📑 Display detailed information about the server'),

    async execute(interaction) {
        const { guild } = interaction;

        const owner = await guild.fetchOwner();
        const channels = guild.channels.cache.filter(c => !c.isThread());
        const textChannels = channels.filter(c => c.type === ChannelType.GuildText);
        const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice || c.type === ChannelType.GuildStageVoice);
        const createdDate = `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`;
        const color = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;

        // Top 5 roles, each on a new line
        const topRoles = guild.roles.cache
            .filter(role => role.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .first(5)
            .map(role => `• ${role}`)
            .join('\n') || 'None';

        const embed = new EmbedBuilder()
            .setTitle(`📊 Server Information: ${guild.name}`)
            .setColor(color)
            .setThumbnail(guild.iconURL({ size: 1024, dynamic: true }))
            .setImage(guild.bannerURL({ size: 1024 }) || null)
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
                    value: `• Text: \`${textChannels.size}\`\n• Voice: \`${voiceChannels.size}\`\n• Total: \`${channels.size}\``,
                    inline: true
                },
                {
                    name: '🎭 Roles',
                    value: `${guild.roles.cache.size}`,
                    inline: true
                },
                {
                    name: '🚀 Boost Info',
                    value: `• Tier: \`Level ${guild.premiumTier || 0}\`\n• Boosts: \`${guild.premiumSubscriptionCount || 0}\``,
                    inline: true
                },
                {
                    name: '🛡️ Verification Level',
                    value: `${guild.verificationLevel}`,
                    inline: true
                },
                {
                    name: '🔝 Top Roles',
                    value: topRoles,
                    inline: false
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
