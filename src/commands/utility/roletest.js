const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
} = require("discord.js");
const { getMemberRoleLevel, getRoleLevelName } = require("../../utils/rolePermissions.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("roletest")
        .setDescription("Test the role permissions system (temporary testing command)")
        .addUserOption(option =>
            option
                .setName("user")
                .setDescription("User to test role detection for")
                .setRequired(false)
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getUser("user") || interaction.user;
        const targetMember = interaction.guild.members.cache.get(targetUser.id);

        if (!targetMember) {
            await interaction.reply({
                content: "User not found in this server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        const roleLevel = getMemberRoleLevel(targetMember);
        const roleLevelName = getRoleLevelName(roleLevel);

        // Get all roles for debugging
        const memberRoles = targetMember.roles.cache
            .filter(role => role.name !== '@everyone')
            .map(role => `${role.name} (${role.permissions.has('Administrator') ? 'Admin' : 'Normal'})`)
            .join('\n') || 'No roles';

        const embed = new EmbedBuilder()
            .setTitle("🧪 Role Detection Test")
            .setColor("#00ff00")
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: "User", value: targetUser.tag, inline: true },
                { name: "Detected Level", value: `${roleLevelName} (${roleLevel})`, inline: true },
                { name: "Is Owner", value: interaction.guild.ownerId === targetUser.id ? "Yes" : "No", inline: true },
                { name: "Has Admin Perms", value: targetMember.permissions.has('Administrator') ? "Yes" : "No", inline: true },
                { name: "All Roles", value: memberRoles, inline: false }
            )
            .setTimestamp();

        await interaction.reply({
            embeds: [embed],
            flags: MessageFlags.Ephemeral,
        });
    },
};