const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for kicking'))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (!target) {
            return interaction.reply({ 
                content: 'User not found!',
                flags: MessageFlags.Ephemeral
            });
        }

        if (!target.kickable) {
            return interaction.reply({ 
                content: 'I cannot kick this user!',
                flags: MessageFlags.Ephemeral
            });
        }

        try {
            await target.kick(reason);
            await interaction.reply({
                content: `Successfully kicked ${target.user.tag}\nReason: ${reason}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error trying to kick this user!',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};