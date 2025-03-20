const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
const config = require('../../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configure welcome message settings')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the welcome message')
                .addStringOption(option =>
                    option.setName('style')
                        .setDescription('The style of the welcome message')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Simple Text', value: 'text' },
                            { name: 'Embed - Basic', value: 'embed_basic' },
                            { name: 'Embed - Advanced', value: 'embed_advanced' }
                        ))
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The welcome message content')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('color')
                        .setDescription('Embed color (hex code)')
                        .addChoices(
                            { name: 'Blue', value: '#0099ff' },
                            { name: 'Green', value: '#00ff00' },
                            { name: 'Red', value: '#ff0000' },
                            { name: 'Purple', value: '#9900ff' }
                        ))
                .addStringOption(option =>
                    option.setName('image')
                        .setDescription('Welcome banner image URL'))
                .addStringOption(option =>
                    option.setName('thumbnail')
                        .setDescription('Thumbnail image URL'))
                .addStringOption(option =>
                    option.setName('footer')
                        .setDescription('Footer text for embed')))
        .addSubcommand(subcommand =>
            subcommand
                .setName('variables')
                .setDescription('Show available message variables'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('test')
                .setDescription('Test the current welcome message'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('disable')
                .setDescription('Disable welcome messages'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'variables') {
            const variablesEmbed = new EmbedBuilder()
                .setTitle('Available Welcome Message Variables')
                .setColor('#0099ff')
                .setDescription('Use these variables in your welcome message:')
                .addFields(
                    { name: '{user}', value: 'Mentions the new member' },
                    { name: '{user.name}', value: 'Username without mention' },
                    { name: '{user.tag}', value: 'Username with discriminator' },
                    { name: '{server}', value: 'Server name' },
                    { name: '{memberCount}', value: 'Current member count' }
                );

            await interaction.reply({ 
                embeds: [variablesEmbed],
                flags: MessageFlags.Ephemeral
            });
            return;
        }

        if (subcommand === 'set') {
            const style = interaction.options.getString('style');
            const message = interaction.options.getString('message');
            const color = interaction.options.getString('color') ?? '#0099ff';
            const image = interaction.options.getString('image');
            const thumbnail = interaction.options.getString('thumbnail');
            const footer = interaction.options.getString('footer');

            // Store the configuration (in a real implementation, this would go to a database)
            const welcomeConfig = {
                style,
                message,
                color,
                image,
                thumbnail,
                footer
            };

            const embed = new EmbedBuilder()
                .setTitle('Welcome Message Configuration')
                .setColor(color)
                .setDescription('Welcome message has been configured!')
                .addFields(
                    { name: 'Style', value: style },
                    { name: 'Message', value: message },
                    { name: 'Channel', value: `<#${config.welcomeChannelId}>` }
                );

            if (image) embed.addFields({ name: 'Banner', value: 'Custom banner image set' });
            if (thumbnail) embed.addFields({ name: 'Thumbnail', value: 'Custom thumbnail set' });
            if (footer) embed.addFields({ name: 'Footer', value: footer });

            await interaction.reply({ 
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });
        } 
        else if (subcommand === 'test') {
            // Create a sample welcome message based on the current configuration
            const testUser = interaction.user;
            const guild = interaction.guild;

            const welcomeEmbed = new EmbedBuilder()
                .setTitle(`Welcome to ${guild.name}!`)
                .setColor('#0099ff')
                .setDescription(`Welcome ${testUser}! We're glad you're here.\n\nThis is a test of the welcome message.`)
                .setThumbnail(testUser.displayAvatarURL())
                .addFields(
                    { name: '👥 Member Count', value: `You are member #${guild.memberCount}` },
                    { name: '📜 Rules', value: 'Please check our rules channel' },
                    { name: '🎉 Have fun!', value: 'Enjoy your stay!' }
                )
                .setTimestamp();

            await interaction.reply({ 
                content: 'Testing welcome message:',
                embeds: [welcomeEmbed]
            });
        }
        else if (subcommand === 'disable') {
            await interaction.reply({ 
                content: 'Welcome messages have been disabled.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};