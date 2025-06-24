const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');
const process = require('process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('📊 Display bot and system statistics'),

    async execute(interaction) {
        const client = interaction.client;

        // Uptime formatting
        const totalSeconds = Math.floor(process.uptime());
        const days = Math.floor(totalSeconds / 86400);
        const hours = Math.floor((totalSeconds % 86400) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const uptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

        // System stats
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotalMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
        const memoryPercent = ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2);

        const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
        const freeMemMB = (os.freemem() / 1024 / 1024).toFixed(2);
        const usedMemMB = (totalMemMB - freeMemMB).toFixed(2);

        const cpuLoad = (os.loadavg()[0] / os.cpus().length).toFixed(2); // 1-min load average per core

        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot & System Statistics')
            .setColor('#00bfff')
            .addFields(
                {
                    name: '📡 Bot Stats',
                    value: [
                        `• **Servers:** \`${client.guilds.cache.size}\``,
                        `• **Users:** \`${client.users.cache.size}\``,
                        `• **Channels:** \`${client.channels.cache.size}\``,
                        `• **Latency:** \`${client.ws.ping}ms\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚙️ System Stats',
                    value: [
                        `• **CPU Load/Core:** \`${cpuLoad}\``,
                        `• **Platform:** \`${process.platform}\``,
                        `• **Node.js:** \`${process.version}\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '💾 Memory Usage',
                    value: [
                        `• **Heap:** \`${heapUsedMB}MB / ${heapTotalMB}MB\` \`${memoryPercent}%\``,
                        `• **System:** \`${usedMemMB}MB / ${totalMemMB}MB\``
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⏱️ Uptime',
                    value: `\`${uptime}\``,
                    inline: true
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
