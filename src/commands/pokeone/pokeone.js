const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokeone')
        .setDescription('🎮 PokeOne - All about pokeone commands!'),

    async execute(interaction) {
        const color = `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`;

        const embed = new EmbedBuilder()
            .setTitle('🔧 PokeOne - Under Maintenance')
            .setDescription('Commands are currently under construction. We\'re working hard to bring you an amazing experience!\n\nStay tuned for updates. In the meantime, try `/serverinfo` or `/help`.')
            .setColor(color)
            .addFields(
                {
                    name: '📝 Status',
                    value: '• **Maintenance Mode:** Active\n• **Estimated Time:** Soon™',
                    inline: false
                },
                {
                    name: '💡 What\'s Coming',
                    value: '• Pokémon battles\n• Team management\n• Trading features\n• And more!',
                    inline: false
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};