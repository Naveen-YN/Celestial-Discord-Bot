const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Display information about a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to get info about')),

    async execute(interaction) {
        const target = interaction.options.getUser('target') ?? interaction.user;
        const member = await interaction.guild.members.fetch(target.id);

        const embed = new EmbedBuilder()
            .setTitle(`${target.tag}'s Information`)
            .setColor(0x0099FF)
            .setThumbnail(target.displayAvatarURL())
            .addFields(
                { name: 'Joined Server', value: `${member.joinedAt.toDateString()}`, inline: true },
                { name: 'Account Created', value: `${target.createdAt.toDateString()}`, inline: true },
                { name: 'Roles', value: member.roles.cache.map(role => role.name).join(', ') },
                { name: 'ID', value: target.id }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
