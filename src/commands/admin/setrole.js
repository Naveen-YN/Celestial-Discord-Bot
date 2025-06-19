const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("setrole")
        .setDescription("Add or remove roles from users")
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Add a role to a user")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("User to add role to")
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("Role to add")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("reason")
                        .setDescription("Reason for adding the role")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("remove")
                .setDescription("Remove a role from a user")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("User to remove role from")
                        .setRequired(true)
                )
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("Role to remove")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("reason")
                        .setDescription("Reason for removing the role")
                        .setRequired(false)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const targetUser = interaction.options.getUser("user");
        const role = interaction.options.getRole("role");
        const reason = interaction.options.getString("reason") || "No reason provided";

        const targetMember = interaction.guild.members.cache.get(targetUser.id);
        const executorMember = interaction.guild.members.cache.get(interaction.user.id);

        if (!targetMember) {
            await interaction.reply({
                content: "User not found in this server.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Check if the executor can manage this role
        if (role.position >= executorMember.roles.highest.position && interaction.guild.ownerId !== interaction.user.id) {
            await interaction.reply({
                content: "You cannot manage this role as it's higher than or equal to your highest role.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        // Check if bot can manage this role
        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            await interaction.reply({
                content: "I cannot manage this role as it's higher than or equal to my highest role.",
                flags: MessageFlags.Ephemeral,
            });
            return;
        }

        try {
            if (subcommand === "add") {
                if (targetMember.roles.cache.has(role.id)) {
                    await interaction.reply({
                        content: `${targetUser.tag} already has the ${role.name} role.`,
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                await targetMember.roles.add(role, `Added by ${interaction.user.tag}: ${reason}`);

                // Log moderation action to database
                try {
                    const { storage } = require("../../../server/storage.js");
                    await storage.addModerationLog({
                        guildId: interaction.guild.id,
                        moderatorId: interaction.user.id,
                        targetUserId: targetUser.id,
                        action: 'role_add',
                        reason: `Added role ${role.name}: ${reason}`
                    });
                } catch (error) {
                    console.error("Error logging moderation action:", error);
                }

                const embed = new EmbedBuilder()
                    .setTitle("✅ Role Added")
                    .setColor("#00ff00")
                    .setDescription(`Successfully added ${role} to ${targetUser}`)
                    .addFields(
                        { name: "Moderator", value: `${interaction.user}`, inline: true },
                        { name: "Reason", value: reason, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });

            } else if (subcommand === "remove") {
                if (!targetMember.roles.cache.has(role.id)) {
                    await interaction.reply({
                        content: `${targetUser.tag} doesn't have the ${role.name} role.`,
                        flags: MessageFlags.Ephemeral,
                    });
                    return;
                }

                await targetMember.roles.remove(role, `Removed by ${interaction.user.tag}: ${reason}`);

                // Log moderation action to database
                try {
                    const { storage } = require("../../../server/storage.js");
                    await storage.addModerationLog({
                        guildId: interaction.guild.id,
                        moderatorId: interaction.user.id,
                        targetUserId: targetUser.id,
                        action: 'role_remove',
                        reason: `Removed role ${role.name}: ${reason}`
                    });
                } catch (error) {
                    console.error("Error logging moderation action:", error);
                }

                const embed = new EmbedBuilder()
                    .setTitle("🗑️ Role Removed")
                    .setColor("#ff9900")
                    .setDescription(`Successfully removed ${role} from ${targetUser}`)
                    .addFields(
                        { name: "Moderator", value: `${interaction.user}`, inline: true },
                        { name: "Reason", value: reason, inline: true }
                    )
                    .setTimestamp();

                await interaction.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: "An error occurred while managing the role. Please check my permissions.",
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};