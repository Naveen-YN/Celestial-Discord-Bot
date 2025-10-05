const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Partials, Events, EmbedBuilder, MessageFlags } = require('discord.js');
const express = require('express');
require('dotenv').config();

// --- Express Server for Web Ping (keeps bot alive on some hosts) ---
const app = express();
const PORT = process.env.PORT || 5000;
app.get('/', (req, res) => res.send('Celestial Discord Bot is running!'));
app.listen(PORT, () => console.log(`Express server is running on port ${PORT}`));

// --- Discord Client Setup ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();

// --- Load Commands from ./commands Directory ---
const foldersPath = path.join(__dirname, 'commands');
if (fs.existsSync(foldersPath)) {
    const commandFolders = fs.readdirSync(foldersPath);
    for (const folder of commandFolders) {
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            } else {
                console.warn(`[WARNING] The command at ${filePath} is missing "data" or "execute".`);
            }
        }
    }
}

// --- Ready Event ---
client.once(Events.ClientReady, async () => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    try {
        const storageModule = require('../server/storage.js');
        const syncGuildsFunc = storageModule?.syncGuilds || storageModule?.storage?.syncGuilds;

        if (typeof syncGuildsFunc === 'function') {
            const guildCount = await syncGuildsFunc(client.guilds.cache);
            console.log(`Synced ${guildCount} guilds to database`);
        } else {
            console.warn('storage.syncGuilds function not found, skipping guild sync.');
        }
    } catch (error) {
        console.error('Error syncing guilds:', error);
    }
});

// --- Handle Slash Commands with Auto-Defer ---
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    // ⏳ Auto-defer after 2s if no immediate reply
    const autoDefer = setTimeout(async () => {
        if (!interaction.deferred && !interaction.replied) {
            try {
                await interaction.deferReply();
                console.log(`Auto-deferred interaction: /${interaction.commandName}`);
            } catch (err) {
                console.warn(`Failed to auto-defer /${interaction.commandName}:`, err.message);
            }
        }
    }, 2000);

    try {
        const storageModule = require('../server/storage.js');

        // --- Custom Commands ---
        if (!command) {
            const getCustomCommand = storageModule?.getCustomCommand || storageModule?.storage?.getCustomCommand;

            if (typeof getCustomCommand === 'function') {
                const customCommand = await getCustomCommand(interaction.commandName, interaction.guild?.id);

                if (customCommand && customCommand.isEnabled) {
                    const { getMemberRoleLevel, ROLE_HIERARCHY } = require('./utils/rolePermissions.js');
                    const requiredLevel = ROLE_HIERARCHY[customCommand.permissions.toUpperCase()] || ROLE_HIERARCHY.EVERYONE;

                    if (interaction.guild) {
                        const member = interaction.guild.members.cache.get(interaction.user.id);
                        const userLevel = getMemberRoleLevel(member);

                        if (userLevel < requiredLevel) {
                            clearTimeout(autoDefer);
                            return interaction.reply({
                                content: `You don't have permission to use this command. Required: ${customCommand.permissions}`,
                                flags: MessageFlags.Ephemeral
                            });
                        }
                    }

                    // Reply content
                    let replyContent = {};
                    if (customCommand.responseType === 'embed' && customCommand.embedData) {
                        replyContent = { embeds: [new EmbedBuilder(customCommand.embedData)] };
                    } else {
                        replyContent = { content: customCommand.response };
                    }

                    clearTimeout(autoDefer);
                    const reply = await interaction.reply(replyContent);

                    // Save to DB (if function exists)
                    const saveBotMessage = storageModule?.saveBotMessage || storageModule?.storage?.saveBotMessage;
                    const incrementCommandUsage = storageModule?.incrementCommandUsage || storageModule?.storage?.incrementCommandUsage;
                    const recordCommandUsage = storageModule?.recordCommandUsage || storageModule?.storage?.recordCommandUsage;

                    if (typeof saveBotMessage === 'function') {
                        await saveBotMessage({
                            guildId: interaction.guild?.id,
                            channelId: interaction.channel.id,
                            messageId: reply.id,
                            messageType: 'custom_command',
                            content: customCommand.responseType === 'text' ? customCommand.response : null,
                            embedData: customCommand.responseType === 'embed' ? customCommand.embedData : null,
                            sentBy: client.user.id
                        });
                    }

                    if (typeof incrementCommandUsage === 'function') {
                        await incrementCommandUsage(interaction.commandName, interaction.guild?.id);
                    }

                    if (typeof recordCommandUsage === 'function') {
                        await recordCommandUsage({
                            guildId: interaction.guild?.id || null,
                            commandName: interaction.commandName,
                            userId: interaction.user.id
                        });
                    }

                    return;
                }
            }

            console.error(`No command matching /${interaction.commandName} found.`);
            clearTimeout(autoDefer);
            return;
        }

        // --- Standard Slash Commands ---
        const { hasCommandPermission, getRequiredRoleLevel, getMemberRoleLevel, createPermissionErrorEmbed } =
            require('./utils/rolePermissions.js');

        if (interaction.guild) {
            const member = interaction.guild.members.cache.get(interaction.user.id);
            if (member && !hasCommandPermission(member, interaction.commandName)) {
                clearTimeout(autoDefer);
                const userLevel = getMemberRoleLevel(member);
                const requiredLevel = getRequiredRoleLevel(interaction.commandName);
                const errorEmbed = createPermissionErrorEmbed(interaction.commandName, userLevel, requiredLevel);

                return interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
            }
        }

        // Execute command
        await command.execute(interaction);
        clearTimeout(autoDefer);

        // Record usage (if function exists)
        const recordCommandUsage = storageModule?.recordCommandUsage || storageModule?.storage?.recordCommandUsage;
        if (typeof recordCommandUsage === 'function') {
            await recordCommandUsage({
                guildId: interaction.guild?.id || null,
                commandName: interaction.commandName,
                userId: interaction.user.id
            });
        }

    } catch (error) {
        clearTimeout(autoDefer);
        console.error(`[Command Error] ${interaction.commandName}:`, error);

        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ There was an error executing this command.',
                flags: MessageFlags.Ephemeral
            });
        } else {
            await interaction.reply({
                content: '❌ There was an error executing this command.',
                flags: MessageFlags.Ephemeral
            });
        }
    }
});

// --- Login to Discord ---
client.login(process.env.TOKEN);
