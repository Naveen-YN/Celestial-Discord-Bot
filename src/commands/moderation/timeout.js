const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Timeout duration in minutes')
                .setRequired(true)
                .addChoices(
                    { name: '1 minute', value: 1 },
                    { name: '5 minutes', value: 5 },
                    { name: '10 minutes', value: 10 },
                    { name: '1 hour', value: 60 },
                    { name: '1 day', value: 1440 },
                ))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for timeout'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (!target) {
            return interaction.reply({ 
                content: 'User not found!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        if (!target.moderatable) {
            return interaction.reply({ 
                content: 'I cannot timeout this user!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        try {
            await target.timeout(duration * 60 * 1000, reason);
            await interaction.reply({
                content: `Successfully timed out ${target.user.tag} for ${duration} minutes\nReason: ${reason}`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error trying to timeout this user!',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};