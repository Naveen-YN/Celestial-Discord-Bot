const { Client, Collection, Events, GatewayIntentBits, MessageFlags, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config.json');
require('./server'); // Import the Express server
require('dotenv').config();
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Make client globally available for message editing
global.discordClient = client;

client.commands = new Collection();

// Load commands from commands directory
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);

        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
        }
    }
}

// Event handler for slash commands
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        // Check for custom commands
        try {
            const { storage } = require('../server/storage.js');
            const customCommand = await storage.getCustomCommand(interaction.commandName, interaction.guild?.id);
            
            if (customCommand && customCommand.isEnabled) {
                // Check permissions for custom command
                const { getMemberRoleLevel, ROLE_HIERARCHY } = require('./utils/rolePermissions.js');
                
                const requiredLevel = ROLE_HIERARCHY[customCommand.permissions.toUpperCase()] || ROLE_HIERARCHY.EVERYONE;
                
                if (interaction.guild) {
                    const member = interaction.guild.members.cache.get(interaction.user.id);
                    const userLevel = getMemberRoleLevel(member);
                    
                    if (userLevel < requiredLevel) {
                        await interaction.reply({
                            content: `You don't have permission to use this command. Required: ${customCommand.permissions}`,
                            flags: MessageFlags.Ephemeral
                        });
                        return;
                    }
                }

                // Execute custom command
                let replyContent = {};
                if (customCommand.responseType === 'embed' && customCommand.embedData) {
                    const embed = new EmbedBuilder(customCommand.embedData);
                    replyContent = { embeds: [embed] };
                } else {
                    replyContent = { content: customCommand.response };
                }

                const reply = await interaction.reply(replyContent);

                // Save bot message to database
                try {
                    await storage.saveBotMessage({
                        guildId: interaction.guild.id,
                        channelId: interaction.channel.id,
                        messageId: reply.id,
                        messageType: 'custom_command',
                        content: customCommand.responseType === 'text' ? customCommand.response : null,
                        embedData: customCommand.responseType === 'embed' ? customCommand.embedData : null,
                        sentBy: client.user.id
                    });
                } catch (error) {
                    console.error("Error saving bot message:", error);
                }

                // Increment usage count and record stats
                await storage.incrementCommandUsage(interaction.commandName, interaction.guild?.id);
                await storage.recordCommandUsage({
                    guildId: interaction.guild?.id || null,
                    commandName: interaction.commandName,
                    userId: interaction.user.id
                });

                return;
            }
        } catch (error) {
            console.error("Error checking custom commands:", error);
        }

        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        // Check role-based permissions
        const { hasCommandPermission, getRequiredRoleLevel, getMemberRoleLevel, createPermissionErrorEmbed } = require('./utils/rolePermissions.js');
        
        if (interaction.guild) {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (member && !hasCommandPermission(member, interaction.commandName)) {
                const userLevel = getMemberRoleLevel(member);
                const requiredLevel = getRequiredRoleLevel(interaction.commandName);
                const errorEmbed = createPermissionErrorEmbed(interaction.commandName, userLevel, requiredLevel);
                
                await interaction.reply({
                    embeds: [errorEmbed],
                    flags: MessageFlags.Ephemeral
                });
                return;
            }
        }

        await command.execute(interaction);

        // Record command usage to database
        try {
            const { storage } = require('../server/storage.js');
            await storage.recordCommandUsage({
                guildId: interaction.guild?.id || null,
                commandName: interaction.commandName,
                userId: interaction.user.id
            });
        } catch (error) {
            console.error("Error recording command usage:", error);
        }
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
                content: 'There was an error executing this command!', 
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({ 
                content: 'There was an error executing this command!', 
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

// Handle new member joins
client.on(Events.GuildMemberAdd, async member => {
    try {
        // In a real implementation, you would fetch this from a database
        const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);

        if (!welcomeChannel) return;

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setColor('#0099ff')
            .setDescription(`Welcome ${member}! We're glad you're here.`)
            .setThumbnail(member.user.displayAvatarURL())
            .addFields(
                { name: '👥 Member Count', value: `You are member #${member.guild.memberCount}`, inline: true },
                { name: '📜 Rules', value: 'Please check our rules channel', inline: true },
                { name: '🎉 Have fun!', value: 'Enjoy your stay!' }
            )
            .setTimestamp();

        await welcomeChannel.send({ embeds: [welcomeEmbed] });
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
});

// Handle process errors to prevent crashes
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
});



// Make bot client globally available for dashboard
global.botClient = client;

// Initialize database with guilds when bot is ready
client.once(Events.ClientReady, async c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    
    // Sync all guilds to database
    try {
        const { storage } = require('../server/storage.js');
        for (const [guildId, guild] of c.guilds.cache) {
            await storage.upsertGuild({
                id: guild.id,
                name: guild.name,
                iconUrl: guild.iconURL(),
                ownerId: guild.ownerId,
                memberCount: guild.memberCount
            });
        }
        console.log(`Synced ${c.guilds.cache.size} guilds to database`);
    } catch (error) {
        console.error('Error syncing guilds to database:', error);
    }
});

client.login(process.env.DISCORD_TOKEN);
