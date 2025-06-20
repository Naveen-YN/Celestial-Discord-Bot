const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

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
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && interaction.guild?.ownerId !== interaction.user.id) {
            return await interaction.reply({
                content: 'You must be the server owner or an administrator to use this command!',
                flags: MessageFlags.Ephemeral
            });
        }

        // Defer the reply to avoid interaction timeout
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        } catch (deferError) {
            console.error('Error deferring reply:', deferError);
            return;
        }

        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        const user = interaction.options.getUser('user');
        const mention = interaction.options.getBoolean('mention') ?? false;

        try {
            if (user) {
                // Send to user via DM
                if (!user.send) throw new Error('Invalid user object');
                await user.send(message);
                // Send notification about sender and origin with blockquote formatting
                const origin = interaction.guild
                    ? `from ${interaction.guild.name} by ${interaction.user.tag}`
                    : `privately by ${interaction.user.tag} via bot DM`;
                await user.send(`> 📬 *This message was sent ${origin}.*`);
                await interaction.editReply({
                    content: `Message successfully sent to ${user.tag}!`
                });
            } else {
                // Send to channel
                if (!channel.send) throw new Error('Invalid channel object');
                await channel.send({
                    content: mention ? `@everyone ${message}` : message
                });
                await interaction.editReply({
                    content: `Message successfully sent to ${channel}!`
                });
            }
        } catch (error) {
            console.error('Error executing sendmessage command:', {
                message: error.message,
                stack: error.stack,
                user: user?.tag || 'N/A',
                channel: channel?.name || 'N/A'
            });
            try {
                await interaction.editReply({
                    content: `There was an error sending the message: ${error.message}`
                });
            } catch (editError) {
                console.error('Error editing reply:', editError);
            }
        }
    },
};