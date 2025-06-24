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

        // Memory usage
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);
        const heapTotalMB = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2);
        const memoryPercent = ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2);

        const totalMemMB = (os.totalmem() / 1024 / 1024).toFixed(2);
        const freeMemMB = (os.freemem() / 1024 / 1024).toFixed(2);
        const usedMemMB = (totalMemMB - freeMemMB).toFixed(2);

        const cpus = os.cpus();
        const cpuModel = cpus[0].model;
        const cpuLoad = (os.loadavg()[0] / cpus.length).toFixed(2);

        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot & System Statistics')
            .setColor('#00bfff')
            .setThumbnail(client.user.displayAvatarURL({ size: 512, dynamic: true }))
            .addFields(
                {
                    name: '📡 Bot Stats',
                    value: [
                        `> • Servers: \`${client.guilds.cache.size}\``,
                        `> • Users: \`${client.users.cache.size}\``,
                        `> • Channels: \`${client.channels.cache.size}\``,
                        `> • Latency: \`${client.ws.ping}ms\``
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⚙️ System Stats',
                    value: [
                        `> • CPU: \`${cpuModel}\``,
                        `> • CPU Load/Core: \`${cpuLoad}\``,
                        `> • Platform: \`${process.platform}\``,
                        `> • Node.js: \`${process.version}\``
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '💾 Memory Usage',
                    value: [
                        `> • Heap: \`${heapUsedMB}MB / ${heapTotalMB}MB\` \`${memoryPercent}%\``,
                        `> • System: \`${usedMemMB}MB / ${totalMemMB}MB\``
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '⏱️ Uptime',
                    value: `> \`${uptime}\``,
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
