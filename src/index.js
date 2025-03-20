const { Client, Collection, Events, GatewayIntentBits, MessageFlags, AttachmentBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config.json');
require('./server'); // Import the Express server
const { createWelcomeImage } = require('./utils/welcomeCanvas');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

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
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
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
        const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
        if (!welcomeChannel) return;

        // Generate welcome image
        const welcomeImageBuffer = await createWelcomeImage(member, {
            textColor: '#ffffff',
            fontSize: 42,
            avatarSize: 128,
        });

        const attachment = new AttachmentBuilder(welcomeImageBuffer, { name: 'welcome.png' });

        const welcomeMessage = `Welcome ${member}! We're glad you're here. 🎉`;

        await welcomeChannel.send({
            content: welcomeMessage,
            files: [attachment]
        });
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

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);