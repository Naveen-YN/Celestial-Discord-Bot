const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announcement')
        .setDescription('Create a server announcement')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the announcement')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The announcement message')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the announcement to'))
        .addBooleanOption(option =>
            option.setName('mention')
                .setDescription('Whether to mention @everyone'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const title = interaction.options.getString('title');
        const message = interaction.options.getString('message');
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        const mention = interaction.options.getBoolean('mention') ?? false;

        const embed = new EmbedBuilder()
            .setTitle(`📢 ${title}`)
            .setDescription(message)
            .setColor(0xFF0000)
            .setTimestamp()
            .setFooter({ text: `Announced by ${interaction.user.tag}` });

        try {
            await channel.send({
                content: mention ? '@everyone' : '',
                embeds: [embed]
            });
            
            await interaction.reply({
                content: `Announcement successfully sent to ${channel}!`,
                ephemeral: true
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error sending the announcement!',
                ephemeral: true
            });
        }
    },
};
