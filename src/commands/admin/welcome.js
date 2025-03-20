const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
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
                    option.setName('message')
                        .setDescription('The welcome message (use {user} for mention, {server} for server name)')
                        .setRequired(true)))
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

        if (subcommand === 'set') {
            const message = interaction.options.getString('message');
            // In a real implementation, you would save this to a database
            // For now, we'll just acknowledge the setting
            const embed = new EmbedBuilder()
                .setTitle('Welcome Message Configuration')
                .setColor(0x00FF00)
                .setDescription('Welcome message has been set!')
                .addFields(
                    { name: 'Message', value: message },
                    { name: 'Channel', value: `<#${config.welcomeChannelId}>` }
                );

            await interaction.reply({ embeds: [embed], ephemeral: true });
        } 
        else if (subcommand === 'test') {
            const testEmbed = new EmbedBuilder()
                .setTitle('👋 Welcome!')
                .setColor(0x00FF00)
                .setDescription(`Welcome to ${interaction.guild.name}!`)
                .setTimestamp();

            await interaction.reply({ content: 'Testing welcome message:', embeds: [testEmbed] });
        }
        else if (subcommand === 'disable') {
            await interaction.reply({ 
                content: 'Welcome messages have been disabled.',
                ephemeral: true 
            });
        }
    },
};
