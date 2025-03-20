const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

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
            return interaction.reply({ 
                content: 'User not found!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        if (!target.bannable) {
            return interaction.reply({ 
                content: 'I cannot ban this user!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        try {
            await target.ban({ reason });
            await interaction.reply({
                content: `Successfully banned ${target.user.tag}\nReason: ${reason}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error trying to ban this user!',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};