const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Bulk delete messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete (max 100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to delete messages from (defaults to current channel)'))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only delete messages from this user'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        const user = interaction.options.getUser('user');

        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            let messages = await channel.messages.fetch({ limit: amount });

            if (user) {
                messages = messages.filter(msg => msg.author.id === user.id);
            }

            const deleted = await channel.bulkDelete(messages, true);

            await interaction.editReply({
                content: `Successfully deleted ${deleted.size} messages${user ? ` from ${user.tag}` : ''} in ${channel}.`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: 'There was an error trying to delete messages! Messages older than 14 days cannot be bulk deleted.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};