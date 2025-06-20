const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('node-fetch');

// Valid SFW tags from waifu.im
const validTags = [
    'maid', 'waifu', 'marin-kitagawa', 'mori-calliope', 'raiden-shogun',
    'oppai', 'selfies', 'uniform', 'kamisato-ayaka'
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('waifu')
        .setDescription('Generates a random anime waifu image from waifu.im, optionally filtered by tag')
        .addStringOption(option =>
            option.setName('tag')
                .setDescription('The tag to filter by (e.g., maid, raiden-shogun). Defaults to waifu.')
                .setRequired(false)),
    async execute(interaction) {
        // Defer reply to avoid timeout
        try {
            await interaction.deferReply();
        } catch (deferError) {
            console.error('Error deferring reply:', {
                message: deferError.message,
                stack: deferError.stack,
            });
            return;
        }

        try {
            // Get tag option, validate, and default to 'waifu'
            let tag = interaction.options.getString('tag')?.toLowerCase() || 'waifu';
            if (!validTags.includes(tag)) {
                tag = 'waifu';
                await interaction.followUp({
                    content: `Invalid tag! Using 'waifu' instead. Valid tags: ${validTags.join(', ')}`,
                    ephemeral: true
                });
            }

            // Fetch random waifu image from waifu.im with tag and is_nsfw=false
            const response = await fetch(`https://api.waifu.im/search?included_tags=${tag}&is_nsfw=false`);
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const data = await response.json();
            const image = data.images[0];
            const imageUrl = image.url;

            // Extract character name from tags
            let characterName = 'Unknown Waifu';
            const tags = image.tags.map(t => t.name);
            // Prioritize character-specific tags (e.g., 'raiden-shogun', 'marin-kitagawa')
            const characterTags = tags.filter(t => validTags.includes(t) && !['waifu', 'maid', 'oppai', 'selfies', 'uniform'].includes(t));
            if (characterTags.length > 0) {
                // Convert tag to readable name (e.g., 'raiden-shogun' → 'Raiden Shogun')
                characterName = characterTags[0]
                    .split('-')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
            }

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle('Your Anime Waifu! 💖')
                .setDescription(`Meet **${characterName}**, your new waifu!`)
                .setImage(imageUrl)
                .setColor('#ff69b4') // Pink for anime aesthetic
                .addFields(
                    { name: 'Tags', value: tags.join(', ') || 'None', inline: true },
                    { name: 'Source', value: image.source ? `[Link](${image.source})` : 'Unknown', inline: true }
                )
                .setFooter({ text: 'Powered by waifu.im' })
                .setTimestamp();

            // Send public reply
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing waifu command:', {
                message: error.message,
                stack: error.stack,
            });
            try {
                await interaction.editReply({
                    content: 'Sorry, I couldn’t fetch a waifu right now! Try again later. 😔'
                });
            } catch (editError) {
                console.error('Error editing reply:', editError);
            }
        }
    },
};