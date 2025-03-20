const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for banning'))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (!target) {
            return interaction.reply({ content: 'User not found!', ephemeral: true });
        }

        if (!target.bannable) {
            return interaction.reply({ content: 'I cannot ban this user!', ephemeral: true });
        }

        try {
            await target.ban({ reason });
            await interaction.reply({
                content: `Successfully banned ${target.user.tag}\nReason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error trying to ban this user!',
                ephemeral: true
            });
        }
    },
};
