const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
} = require("discord.js");
const { 
    ROLE_HIERARCHY, 
    COMMAND_PERMISSIONS, 
    getMemberRoleLevel, 
    getRoleLevelName,
    hasCommandPermission 
} = require("../../utils/rolePermissions.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("permissions")
        .setDescription("Manage and view role-based command permissions")
        .addSubcommand(subcommand =>
            subcommand
                .setName("check")
                .setDescription("Check a user's role level and command permissions")
                .addUserOption(option =>
                    option
                        .setName("user")
                        .setDescription("User to check permissions for")
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("List all commands and their required role levels")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("hierarchy")
                .setDescription("Show the role hierarchy system")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "check") {
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

            // Get available commands for this user
            const availableCommands = [];
            const restrictedCommands = [];

            Object.entries(COMMAND_PERMISSIONS).forEach(([command, requiredLevel]) => {
                if (roleLevel >= requiredLevel) {
                    availableCommands.push(`/${command}`);
                } else {
                    restrictedCommands.push(`/${command} (requires ${getRoleLevelName(requiredLevel)})`);
                }
            });

            const embed = new EmbedBuilder()
                .setTitle(`🔐 Permissions for ${targetUser.tag}`)
                .setColor("#5865f2")
                .setThumbnail(targetUser.displayAvatarURL())
                .addFields(
                    { 
                        name: "Role Level", 
                        value: `${roleLevelName} (Level ${roleLevel})`, 
                        inline: true 
                    },
                    { 
                        name: "Available Commands", 
                        value: availableCommands.length > 0 ? availableCommands.join(", ") : "None", 
                        inline: false 
                    }
                );

            if (restrictedCommands.length > 0) {
                embed.addFields({
                    name: "Restricted Commands",
                    value: restrictedCommands.slice(0, 10).join("\n") + 
                           (restrictedCommands.length > 10 ? `\n... and ${restrictedCommands.length - 10} more` : ""),
                    inline: false
                });
            }

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });

        } else if (subcommand === "list") {
            const commandsByLevel = {};

            // Group commands by required level
            Object.entries(COMMAND_PERMISSIONS).forEach(([command, level]) => {
                if (!commandsByLevel[level]) {
                    commandsByLevel[level] = [];
                }
                commandsByLevel[level].push(command);
            });

            const embed = new EmbedBuilder()
                .setTitle("📋 Command Permission Requirements")
                .setColor("#0099ff")
                .setDescription("Commands grouped by minimum required role level:");

            // Sort levels from highest to lowest
            const sortedLevels = Object.keys(commandsByLevel)
                .map(Number)
                .sort((a, b) => b - a);

            sortedLevels.forEach(level => {
                const commands = commandsByLevel[level];
                embed.addFields({
                    name: `${getRoleLevelName(level)} (Level ${level})`,
                    value: commands.map(cmd => `/${cmd}`).join(", "),
                    inline: false
                });
            });

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });

        } else if (subcommand === "hierarchy") {
            const embed = new EmbedBuilder()
                .setTitle("🏆 Role Hierarchy System")
                .setColor("#ffd700")
                .setDescription("Role levels from highest to lowest permission:");

            const hierarchyLevels = Object.entries(ROLE_HIERARCHY)
                .sort(([,a], [,b]) => b - a);

            let hierarchyText = "";
            hierarchyLevels.forEach(([name, level]) => {
                const icon = level >= 90 ? "👑" : level >= 70 ? "🛡️" : level >= 30 ? "⭐" : "👤";
                hierarchyText += `${icon} **${name}** - Level ${level}\n`;
            });

            embed.addFields(
                {
                    name: "Hierarchy Levels",
                    value: hierarchyText,
                    inline: false
                },
                {
                    name: "How It Works",
                    value: "• Roles are automatically detected based on names and permissions\n" +
                           "• Higher level roles can use commands of lower levels\n" +
                           "• Server owners always have the highest permissions\n" +
                           "• Administrator permission grants Admin level access",
                    inline: false
                }
            );

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });
        }
    },
};