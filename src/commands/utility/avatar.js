const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get the avatar of a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to get the avatar from')),

    async execute(interaction) {
        const target = interaction.options.getUser('target') ?? interaction.user;

        const embed = new EmbedBuilder()
            .setTitle(`${target.username}'s Avatar`)
            .setColor(0x0099FF)
            .setImage(target.displayAvatarURL({ size: 1024, dynamic: true }))
            .addFields(
                { name: 'Avatar URL', value: `[Click here](${target.displayAvatarURL({ size: 1024, dynamic: true })})` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
