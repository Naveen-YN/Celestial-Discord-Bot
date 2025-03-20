const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Display bot statistics'),

    async execute(interaction) {
        const client = interaction.client;
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor(uptime / 3600) % 24;
        const minutes = Math.floor(uptime / 60) % 60;
        const seconds = Math.floor(uptime % 60);

        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Statistics')
            .setColor('#0099ff')
            .addFields(
                { 
                    name: '📊 Server Stats',
                    value: [
                        `**Servers:** ${client.guilds.cache.size}`,
                        `**Users:** ${client.users.cache.size}`,
                        `**Channels:** ${client.channels.cache.size}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⚙️ System Stats',
                    value: [
                        `**Memory:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                        `**Node.js:** ${process.version}`,
                        `**Platform:** ${process.platform}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '⏰ Uptime',
                    value: `${days}d ${hours}h ${minutes}m ${seconds}s`,
                    inline: true
                },
                {
                    name: '🔄 Performance',
                    value: [
                        `**API Latency:** ${client.ws.ping}ms`,
                        `**CPU Usage:** ${(process.cpuUsage().user / 1024 / 1024).toFixed(2)}%`,
                        `**Memory Usage:** ${(process.memoryUsage().heapUsed / process.memoryUsage().heapTotal * 100).toFixed(2)}%`
                    ].join('\n'),
                    inline: false
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
