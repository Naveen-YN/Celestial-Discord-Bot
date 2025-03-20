const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Manage roles for users')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to add the role to')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from a user')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('The user to remove the role from')
                        .setRequired(true))
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const target = interaction.options.getMember('target');
        const role = interaction.options.getRole('role');

        if (!target) {
            return interaction.reply({ content: 'User not found!', ephemeral: true });
        }

        if (!role) {
            return interaction.reply({ content: 'Role not found!', ephemeral: true });
        }

        if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: 'I cannot manage this role as it is above my highest role!',
                ephemeral: true
            });
        }

        try {
            if (subcommand === 'add') {
                await target.roles.add(role);
                await interaction.reply({
                    content: `Added role ${role.name} to ${target.user.tag}`,
                    ephemeral: true
                });
            } else if (subcommand === 'remove') {
                await target.roles.remove(role);
                await interaction.reply({
                    content: `Removed role ${role.name} from ${target.user.tag}`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            });
        }
    },
};
