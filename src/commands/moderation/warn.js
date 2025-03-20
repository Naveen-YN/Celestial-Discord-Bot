const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Warn a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to warn')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for warning'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const target = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        if (!target) {
            return interaction.reply({ 
                content: 'User not found!', 
                flags: MessageFlags.Ephemeral 
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('⚠️ User Warned')
            .setColor(0xFFFF00)
            .setDescription(`${target.user.tag} has been warned`)
            .addFields(
                { name: 'Reason', value: reason },
                { name: 'Warned by', value: interaction.user.tag }
            )
            .setTimestamp();

        // Send warning to the user
        try {
            await target.send({
                content: `You have been warned in ${interaction.guild.name}\nReason: ${reason}`,
            });
        } catch (error) {
            console.error('Could not DM user:', error);
        }

        await interaction.reply({ 
            embeds: [embed], 
            flags: MessageFlags.Ephemeral 
        });
    },
};