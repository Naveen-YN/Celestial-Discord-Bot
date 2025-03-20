const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Configure auto-role settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a role to auto-role list')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to add to auto-role')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Remove a role from auto-role list')
                .addRoleOption(option =>
                    option.setName('role')
                        .setDescription('The role to remove from auto-role')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('List all auto-roles'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'add') {
            const role = interaction.options.getRole('role');

            if (role.managed) {
                return interaction.reply({ 
                    content: 'Cannot add managed roles to auto-role.',
                    flags: MessageFlags.Ephemeral 
                });
            }

            if (role.position >= interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({ 
                    content: 'Cannot add roles higher than my highest role.',
                    flags: MessageFlags.Ephemeral 
                });
            }

            // In a real implementation, you would save this to a database
            const embed = new EmbedBuilder()
                .setTitle('Auto-Role Configuration')
                .setColor(0x00FF00)
                .setDescription(`Added ${role.name} to auto-role list`)
                .setTimestamp();

            await interaction.reply({ 
                embeds: [embed], 
                flags: MessageFlags.Ephemeral 
            });
        }
        else if (subcommand === 'remove') {
            const role = interaction.options.getRole('role');

            const embed = new EmbedBuilder()
                .setTitle('Auto-Role Configuration')
                .setColor(0xFF0000)
                .setDescription(`Removed ${role.name} from auto-role list`)
                .setTimestamp();

            await interaction.reply({ 
                embeds: [embed], 
                flags: MessageFlags.Ephemeral 
            });
        }
        else if (subcommand === 'list') {
            // In a real implementation, you would fetch this from a database
            const embed = new EmbedBuilder()
                .setTitle('Auto-Role List')
                .setColor(0x0099FF)
                .setDescription('Currently configured auto-roles:')
                .addFields(
                    { name: 'Roles', value: 'No auto-roles configured' }
                )
                .setTimestamp();

            await interaction.reply({ 
                embeds: [embed], 
                flags: MessageFlags.Ephemeral 
            });
        }
    },
};