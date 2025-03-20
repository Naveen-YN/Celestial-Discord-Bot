const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Create a custom embed message')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the embed')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to send the embed to'))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color of the embed')
                .addChoices(
                    { name: 'Blue', value: '#0099ff' },
                    { name: 'Red', value: '#ff0000' },
                    { name: 'Green', value: '#00ff00' },
                    { name: 'Yellow', value: '#ffff00' },
                    { name: 'Purple', value: '#9900ff' },
                ))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('The URL of the image to display'))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('The URL of the thumbnail to display'))
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL for the embed title'))
        .addStringOption(option =>
            option.setName('author_name')
                .setDescription('Name of the author'))
        .addStringOption(option =>
            option.setName('author_icon')
                .setDescription('URL for the author\'s icon'))
        .addStringOption(option =>
            option.setName('field1_name')
                .setDescription('Name of the first field'))
        .addStringOption(option =>
            option.setName('field1_value')
                .setDescription('Value of the first field'))
        .addStringOption(option =>
            option.setName('field2_name')
                .setDescription('Name of the second field'))
        .addStringOption(option =>
            option.setName('field2_value')
                .setDescription('Value of the second field'))
        .addBooleanOption(option =>
            option.setName('timestamp')
                .setDescription('Include current timestamp?'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        const color = interaction.options.getString('color') ?? '#0099ff';
        const image = interaction.options.getString('image');
        const thumbnail = interaction.options.getString('thumbnail');
        const url = interaction.options.getString('url');
        const authorName = interaction.options.getString('author_name');
        const authorIcon = interaction.options.getString('author_icon');
        const field1Name = interaction.options.getString('field1_name');
        const field1Value = interaction.options.getString('field1_value');
        const field2Name = interaction.options.getString('field2_name');
        const field2Value = interaction.options.getString('field2_value');
        const includeTimestamp = interaction.options.getBoolean('timestamp') ?? false;

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color);

        if (url) embed.setURL(url);
        if (image) embed.setImage(image);
        if (thumbnail) embed.setThumbnail(thumbnail);
        if (authorName) {
            const authorOptions = { name: authorName };
            if (authorIcon) authorOptions.iconURL = authorIcon;
            embed.setAuthor(authorOptions);
        }
        if (field1Name && field1Value) {
            embed.addFields({ name: field1Name, value: field1Value });
        }
        if (field2Name && field2Value) {
            embed.addFields({ name: field2Name, value: field2Value });
        }
        if (includeTimestamp) embed.setTimestamp();

        embed.setFooter({ text: `Created by ${interaction.user.tag}` });

        try {
            await channel.send({ embeds: [embed] });
            await interaction.reply({
                content: `Embed successfully sent to ${channel}!`,
                flags: MessageFlags.Ephemeral
            });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'There was an error sending the embed! Make sure all URLs are valid and I have permission to send messages in the target channel.',
                flags: MessageFlags.Ephemeral
            });
        }
    },
};