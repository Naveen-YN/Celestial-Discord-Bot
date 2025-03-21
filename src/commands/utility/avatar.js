const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get the avatar of a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The 👤user to get the avatar from')),

    async execute(interaction) {
        const user = interaction.options.getUser('user') ?? interaction.user;

        // Generate a random color
        const randomColor = Math.floor(Math.random() * 16777215).toString(16);

        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Avatar`)
            .setColor(`#${randomColor}`)
            .setImage(user.displayAvatarURL({ size: 1024, dynamic: true }))
            .addFields(
                { name: 'Avatar URL', value: `[Click here](${user.displayAvatarURL({ size: 1024, dynamic: true })})` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
