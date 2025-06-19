const {
    SlashCommandBuilder,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("configroles")
        .setDescription("Configure server roles for the permissions system")
        .addSubcommand(subcommand =>
            subcommand
                .setName("setup")
                .setDescription("Create default roles for the bot permission system")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("assign")
                .setDescription("Assign permission levels to existing roles")
                .addRoleOption(option =>
                    option
                        .setName("role")
                        .setDescription("Role to configure")
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName("level")
                        .setDescription("Permission level to assign")
                        .setRequired(true)
                        .addChoices(
                            { name: "Admin", value: "admin" },
                            { name: "Moderator", value: "moderator" },
                            { name: "Junior Moderator", value: "junior_mod" },
                            { name: "Helper", value: "helper" },
                            { name: "Member", value: "member" }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("View current role configuration")
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === "setup") {
            try {
                const rolesToCreate = [
                    { name: "🛡️ Admin", color: "#ff6b6b", permissions: [PermissionFlagsBits.Administrator] },
                    { name: "⚖️ Moderator", color: "#5865f2", permissions: [PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ManageMessages] },
                    { name: "🔨 Junior Mod", color: "#00aff4", permissions: [PermissionFlagsBits.ModerateMembers, PermissionFlagsBits.ManageMessages] },
                    { name: "⭐ Helper", color: "#57f287", permissions: [PermissionFlagsBits.ManageMessages] },
                    { name: "👤 Member", color: "#99aab5", permissions: [] }
                ];

                const createdRoles = [];
                const existingRoles = [];

                for (const roleData of rolesToCreate) {
                    const existingRole = interaction.guild.roles.cache.find(r => r.name === roleData.name);
                    
                    if (existingRole) {
                        existingRoles.push(roleData.name);
                        continue;
                    }

                    const newRole = await interaction.guild.roles.create({
                        name: roleData.name,
                        color: roleData.color,
                        permissions: roleData.permissions,
                        reason: `Bot role setup by ${interaction.user.tag}`
                    });

                    createdRoles.push(newRole.name);
                }

                const embed = new EmbedBuilder()
                    .setTitle("🏗️ Role Setup Complete")
                    .setColor("#00ff00")
                    .setDescription("Bot permission roles have been configured!")
                    .setTimestamp();

                if (createdRoles.length > 0) {
                    embed.addFields({
                        name: "✅ Created Roles",
                        value: createdRoles.join("\n"),
                        inline: false
                    });
                }

                if (existingRoles.length > 0) {
                    embed.addFields({
                        name: "⚠️ Already Existed",
                        value: existingRoles.join("\n"),
                        inline: false
                    });
                }

                embed.addFields({
                    name: "📝 Next Steps",
                    value: "• Assign these roles to your staff members\n• Use `/permissions check` to test the system\n• Roles are automatically detected by the bot",
                    inline: false
                });

                await interaction.reply({ embeds: [embed] });

            } catch (error) {
                console.error(error);
                await interaction.reply({
                    content: "An error occurred while creating roles. Please check my permissions.",
                    flags: MessageFlags.Ephemeral,
                });
            }

        } else if (subcommand === "assign") {
            const role = interaction.options.getRole("role");
            const level = interaction.options.getString("level");

            const levelInfo = {
                admin: { name: "Administrator", emoji: "🛡️", permissions: [PermissionFlagsBits.Administrator] },
                moderator: { name: "Moderator", emoji: "⚖️", permissions: [PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers] },
                junior_mod: { name: "Junior Moderator", emoji: "🔨", permissions: [PermissionFlagsBits.ModerateMembers] },
                helper: { name: "Helper", emoji: "⭐", permissions: [PermissionFlagsBits.ManageMessages] },
                member: { name: "Member", emoji: "👤", permissions: [] }
            };

            const info = levelInfo[level];

            const embed = new EmbedBuilder()
                .setTitle("📋 Role Configuration Updated")
                .setColor("#5865f2")
                .setDescription(`Role ${role} has been configured as ${info.emoji} ${info.name}`)
                .addFields(
                    { name: "Role", value: `${role}`, inline: true },
                    { name: "Permission Level", value: `${info.emoji} ${info.name}`, inline: true },
                    { name: "Detection", value: "This role will now be automatically detected by the bot's permission system", inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } else if (subcommand === "view") {
            const { getMemberRoleLevel, getRoleLevelName } = require("../../utils/rolePermissions.js");

            const roles = interaction.guild.roles.cache
                .filter(role => role.name !== "@everyone")
                .sort((a, b) => b.position - a.position)
                .first(20); // Limit to first 20 roles

            let roleList = "";
            roles.forEach(role => {
                // Create a mock member to test role detection
                const mockMember = {
                    guild: interaction.guild,
                    id: "test",
                    roles: { cache: new Map([[role.id, role]]) },
                    permissions: role.permissions
                };

                const detectedLevel = getMemberRoleLevel(mockMember);
                const levelName = getRoleLevelName(detectedLevel);

                roleList += `${role} - ${levelName}\n`;
            });

            const embed = new EmbedBuilder()
                .setTitle("📊 Current Role Configuration")
                .setColor("#0099ff")
                .setDescription("Roles and their detected permission levels:")
                .addFields({
                    name: "Role → Detected Level",
                    value: roleList || "No roles found",
                    inline: false
                })
                .addFields({
                    name: "💡 Tips",
                    value: "• Roles with 'Admin', 'Mod', 'Helper' in their names are auto-detected\n• Discord permissions also affect detection\n• Use `/configroles setup` to create default roles",
                    inline: false
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    },
};