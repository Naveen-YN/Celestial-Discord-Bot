const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelinfo')
        .setDescription('Display information about a channel')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to get info about')),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') ?? interaction.channel;
        
        const typeText = {
            [ChannelType.GuildText]: 'Text Channel',
            [ChannelType.GuildVoice]: 'Voice Channel',
            [ChannelType.GuildCategory]: 'Category',
            [ChannelType.GuildNews]: 'News Channel',
            [ChannelType.GuildStageVoice]: 'Stage Channel',
            [ChannelType.GuildForum]: 'Forum Channel',
        };

        const embed = new EmbedBuilder()
            .setTitle(`${channel.name} Information`)
            .setColor(0x0099FF)
            .addFields(
                { name: 'Type', value: typeText[channel.type] || 'Unknown', inline: true },
                { name: 'ID', value: channel.id, inline: true },
                { name: 'Created At', value: channel.createdAt.toDateString(), inline: true },
                { name: 'Category', value: channel.parent?.name || 'None', inline: true },
                { name: 'Position', value: `${channel.position}`, inline: true }
            )
            .setTimestamp();

        if (channel.type === ChannelType.GuildText) {
            embed.addFields(
                { name: 'Topic', value: channel.topic || 'No topic set', inline: false },
                { name: 'NSFW', value: channel.nsfw ? 'Yes' : 'No', inline: true },
                { name: 'Slowmode', value: `${channel.rateLimitPerUser}s`, inline: true }
            );
        }

        await interaction.reply({ embeds: [embed] });
    },
};
