const { SlashCommandBuilder, PermissionFlagsBits, InteractionResponseFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sendmessage')
        .setDescription('Send a plain text message to a user or channel (Admin/Owner only)')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The message content')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the message to (optional)'))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to send the message to (optional)'))
        .addBooleanOption(option =>
            option.setName('mention')
                .setDescription('Whether to mention @everyone if sending to a channel'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Check if user is the server owner or has Administrator permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && interaction.guild.ownerId !== interaction.user.id) {
            return await interaction.reply({
                content: 'You must be the server owner or an administrator to use this command!',
                flags: InteractionResponseFlags.Ephemeral
            });
        }

        // Defer the reply to avoid interaction timeout
        await interaction.deferReply({ flags: InteractionResponseFlags.Ephemeral });

        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        const user = interaction.options.getUser('user');
        const mention = interaction.options.getBoolean('mention') ?? false;

        try {
            if (user) {
                // Send to user via DM
                await user.send(message);
                await interaction.editReply({
                    content: `Message successfully sent to ${user.tag}!`
                });
            } else {
                // Send to channel
                await channel.send({
                    content: mention ? `@everyone ${message}` : message
                });
                await interaction.editReply({
                    content: `Message successfully sent to ${channel}!`
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: 'There was an error sending the message!'
            });
        }
    },
};