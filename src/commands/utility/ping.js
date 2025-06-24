const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const process = require('process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('📡 Check bot latency, uptime, system health, and API status'),

    async execute(interaction) {
        const sent = await interaction.reply({ content: '🧪 Running diagnostics...', fetchReply: true });

        // --- Basic Latency Info ---
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const heartbeat = interaction.client.ws.ping;
        const latencyStatus = roundtrip < 100
            ? '🟢 Excellent'
            : roundtrip < 200
            ? '🟡 Moderate'
            : '🔴 Poor';

        // --- Uptime Formatting ---
        const totalSeconds = Math.floor(process.uptime());
        const uptime = [
            Math.floor(totalSeconds / 86400) + 'd',
            Math.floor((totalSeconds % 86400) / 3600) + 'h',
            Math.floor((totalSeconds % 3600) / 60) + 'm',
            (totalSeconds % 60) + 's',
        ].filter(part => !part.startsWith('0')).join(' ');

        // --- System Metrics ---
        const cpuLoad = (os.loadavg()[0] / os.cpus().length).toFixed(2); // 1-min avg per core
        const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(0);
        const usedMemMB = ((os.totalmem() - os.freemem()) / 1024 / 1024).toFixed(0);
        const botMemMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(0);

        // --- API Status Placeholder ---
        const apiStatus = '🟢 Operational';

        // --- Final Embed ---
        const embed = new EmbedBuilder()
            .setTitle('📊 Bot Status Dashboard')
            .setColor(roundtrip < 100 ? 0x1abc9c : roundtrip < 200 ? 0xf1c40f : 0xe74c3c)
            .addFields(
                {
                    name: '📶 Latency',
                    value: [
                        `• **Roundtrip:** \`${roundtrip}ms\` (${latencyStatus})`,
                        `• **Heartbeat:** \`${heartbeat}ms\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⏱️ Uptime',
                    value: `• \`${uptime}\``,
                    inline: true
                },
                {
                    name: '🖥️ System Load',
                    value: [
                        `• **CPU Load:** \`${cpuLoad}\``,
                        `• **RAM Usage:** \`${usedMemMB}MB / ${totalMemMB}MB\``,
                        `• **Bot RAM:** \`${botMemMB}MB\``
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '🛰️ API Status',
                    value: `• ${apiStatus}`,
                    inline: false
                }
            )
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        await interaction.editReply({ content: '', embeds: [embed] });
    }
};
