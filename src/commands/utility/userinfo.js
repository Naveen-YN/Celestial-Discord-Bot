const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionsBitField,
    UserFlagsBitField
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('👤 Display information about a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to get info about')
        ),

    async execute(interaction) {
        const target = interaction.options.getUser('target') ?? interaction.user;
        const member = await interaction.guild.members.fetch(target.id);
        const fullUser = await target.fetch(); // Fetch full user to get banner

        const isBot = target.bot ? '🤖 Yes' : '👤 No';
        const joinedAt = `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`;
        const createdAt = `<t:${Math.floor(target.createdTimestamp / 1000)}:F>`;
        const nickname = member.nickname ?? 'None';
        const displayName = member.displayName ?? 'None';

        // Presence and activity
        const presence = member.presence;
        const status = presence?.status ?? 'Offline';
        const activities = presence?.activities?.length
            ? presence.activities.map(a => `${a.type}: ${a.name}`).join('\n')
            : 'None';

        // Boost info
        const boosted = member.premiumSince
            ? `<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:F>`
            : 'Not boosting';

        // Permissions
        const permissions = member.permissions.toArray().slice(0, 10).map(p => `\`${p}\``).join(', ') || 'None';

        // Badges / flags
        const flags = target.flags?.toArray() ?? [];
        const badges = flags.length > 0
            ? flags.map(f => `\`${f.replace(/_/g, ' ').toLowerCase()}\``).join(', ')
            : 'None';

        // Roles
        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString())
            .join(' ') || 'None';

        const embed = new EmbedBuilder()
            .setTitle(`👤 User Info: ${target.tag}`)
            .setColor(member.displayHexColor || 0x0099ff)
            .setThumbnail(target.displayAvatarURL({ size: 512, dynamic: true }))
            .addFields(
                { name: '🆔 User ID', value: `> ${target.id}`, inline: true },
                { name: '🤖 Is a Bot?', value: `> ${isBot}`, inline: true },
                { name: '🪪 Display Name', value: `> ${displayName}`, inline: false },
                { name: '📛 Nickname', value: `> ${nickname}`, inline: true },
                { name: '📅 Account Created', value: `> ${createdAt}`, inline: false },
                { name: '📥 Joined Server', value: `> ${joinedAt}`, inline: false },
                { name: '🚀 Boosting Since', value: `> ${boosted}`, inline: false },
                { name: '🎮 Status / Activity', value: `> **Status:** ${status}\n> **Activities:**\n${activities}`, inline: false },
                { name: '🛡️ Permissions', value: permissions, inline: false },
                { name: '🎖️ Badges', value: badges, inline: false },
                { name: `🎭 Roles [${member.roles.cache.size - 1}]`, value: roles, inline: false }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Add banner if available
        if (fullUser.banner) {
            embed.setImage(fullUser.bannerURL({ size: 1024, dynamic: true }));
        }

        await interaction.reply({ embeds: [embed] });
    },
};
