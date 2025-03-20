const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setDescription('Lock or unlock a channel')
        .addSubcommand(subcommand =>
            subcommand
                .setName('lock')
                .setDescription('Lock the channel')
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('Reason for lockdown')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('unlock')
                .setDescription('Unlock the channel'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        try {
            if (subcommand === 'lock') {
                await interaction.channel.permissionOverwrites.edit(
                    interaction.guild.roles.everyone,
                    { SendMessages: false }
                );
                await interaction.reply({
                    content: `🔒 Channel locked.\nReason: ${reason}`,
                    ephemeral: false
                });
            } else if (subcommand === 'unlock') {
                await interaction.channel.permissionOverwrites.edit(
                    interaction.guild.roles.everyone,
                    { SendMessages: null }
                );
                await interaction.reply({
                    content: '🔓 Channel unlocked.',
                    ephemeral: false
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
