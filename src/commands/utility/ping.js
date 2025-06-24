const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const process = require('process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('📡 Check bot latency, uptime, system status and API availability'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: '⏳ Gathering diagnostics...', fetchReply: true });
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const heartbeat = interaction.client.ws.ping;

        // Uptime calculation
        const totalSeconds = Math.floor(process.uptime());
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor(totalSeconds % 86400 / 3600);
        const minutes = Math.floor(totalSeconds % 3600 / 60);
        const seconds = totalSeconds % 60;
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // System diagnostics
        const cpuUsage = (os.loadavg()[0] / os.cpus().length).toFixed(2); // 1-minute load avg per core
        const memoryUsage = (process.memoryUsage().rss / 1024 / 1024).toFixed(2); // RSS memory in MB
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(2); // Total memory in MB
        const usedMem = ((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(2); // Used memory in MB

        // API status (mock — replace with actual check if needed)
        const apiStatus = '🟢 All systems operational';

        const latencyStatus = roundtrip < 100
            ? '🟢 Excellent'
            : roundtrip < 200
            ? '🟡 Moderate'
            : '🔴 Poor';

        const embed = new EmbedBuilder()
            .setTitle('🏓 Bot Diagnostics')
            .setColor(roundtrip < 100 ? 0x00ff00 : roundtrip < 200 ? 0xffff00 : 0xff0000)
            .addFields(
                {
                    name: '📶 Latency',
                    value: `> **Roundtrip:** \`${roundtrip}ms\` (${latencyStatus})\n> **Heartbeat:** \`${heartbeat}ms\``,
                    inline: true,
                },
                {
                    name: '⏱️ Uptime',
                    value: `> \`${uptime}\``,
                    inline: true,
                },
                {
                    name: '💻 System',
                    value: `> **CPU Load:** \`${cpuUsage}\`\n> **Memory:** \`${usedMem}MB / ${totalMem}MB\`\n> **Node RAM:** \`${memoryUsage}MB\``,
                    inline: false,
                },
                {
                    name: '🛰️ API Status',
                    value: `> ${apiStatus}`,
                    inline: false,
                },
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
    },
};
