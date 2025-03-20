const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags, ChannelType, AttachmentBuilder } = require('discord.js');
const { createWelcomeImage } = require('../../utils/welcomeCanvas');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure welcome message settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the welcome message')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('The channel to send welcome messages')
                        .addChannelTypes(ChannelType.GuildText)
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('background')
                        .setDescription('URL of the background image for welcome messages'))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Text color (hex code)')
                        .addChoices(
                            { name: 'White', value: '#ffffff' },
                            { name: 'Gold', value: '#ffd700' },
                            { name: 'Aqua', value: '#00ffff' },
                            { name: 'Pink', value: '#ff69b4' }
                        )))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test the current welcome message'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview the welcome image with current settings'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            const channel = interaction.options.getChannel('channel');
            const background = interaction.options.getString('background');
            const textColor = interaction.options.getString('color') ?? '#ffffff';

            // Store these settings (in a real implementation, save to database)
            const welcomeConfig = {
                channelId: channel.id,
                background,
                textColor
            };

            await interaction.editReply({
                content: `Welcome messages will now be sent to ${channel} with the specified settings!`,
                flags: MessageFlags.Ephemeral
            });
        }
        else if (subcommand === 'test' || subcommand === 'preview') {
            try {
                const welcomeImageBuffer = await createWelcomeImage(interaction.member, {
                    textColor: '#ffffff',
                    fontSize: 42,
                    avatarSize: 128,
                });

                const attachment = new AttachmentBuilder(welcomeImageBuffer, { name: 'welcome-preview.png' });

                if (subcommand === 'preview') {
                    await interaction.editReply({
                        content: 'Here\'s how the welcome image will look:',
                        files: [attachment]
                    });
                } else {
                    const channel = interaction.channel;
                    await channel.send({
                        content: `Welcome ${interaction.user}! (Test Message)`,
                        files: [attachment]
                    });
                    await interaction.editReply({
                        content: 'Test welcome message sent!',
                        flags: MessageFlags.Ephemeral
                    });
                }
            } catch (error) {
                console.error('Error generating welcome image:', error);
                await interaction.editReply({
                    content: 'There was an error generating the welcome image. Please check the image URLs and try again.',
                    flags: MessageFlags.Ephemeral
                });
            }
        }
    },
};