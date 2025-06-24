const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('📡 Check the bot\'s latency and heartbeat'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: '⏳ Calculating latency...', fetchReply: true });
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const heartbeat = interaction.client.ws.ping;

        // Determine latency status
        const latencyStatus = roundtrip < 100
            ? '🟢 Excellent'
            : roundtrip < 200
            ? '🟡 Moderate'
            : '🔴 Poor';

        const embed = new EmbedBuilder()
            .setTitle('🏓 Pong!')
            .setDescription(`> **Roundtrip:** \`${roundtrip}ms\` (${latencyStatus})\n> **Heartbeat:** \`${heartbeat}ms\``)
            .setColor(roundtrip < 100 ? 0x00ff00 : roundtrip < 200 ? 0xffff00 : 0xff0000)
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
    },
};
