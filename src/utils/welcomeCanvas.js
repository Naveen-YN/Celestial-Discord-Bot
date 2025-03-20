const { createCanvas, loadImage, registerFont } = require('canvas');

async function createWelcomeImage(member, options = {}) {
    const {
        backgroundImage = 'https://i.imgur.com/8nLFCVP.png', // Default background
        textColor = '#ffffff',
        fontSize = 42,
        avatarSize = 128,
    } = options;

    // Create canvas
    const canvas = createCanvas(1024, 500);
    const ctx = canvas.getContext('2d');

    try {
        // Load and draw background
        const background = await loadImage(backgroundImage);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

        // Add semi-transparent overlay for better text visibility
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Load and draw avatar
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
        
        // Create circular avatar
        ctx.save();
        ctx.beginPath();
        const avatarX = canvas.width / 2 - avatarSize / 2;
        const avatarY = 120;
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        
        // Add avatar border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.stroke();
        ctx.restore();

        // Configure text settings
        ctx.textAlign = 'center';
        ctx.fillStyle = textColor;

        // Draw welcome text
        ctx.font = `${fontSize}px "Arial"`;
        ctx.fillText('WELCOME', canvas.width / 2, 320);

        // Draw username
        ctx.font = `${fontSize - 10}px "Arial"`;
        ctx.fillText(member.user.tag, canvas.width / 2, 375);

        // Draw member count
        ctx.font = `${fontSize - 15}px "Arial"`;
        ctx.fillText(`You are member #${member.guild.memberCount}`, canvas.width / 2, 425);

        return canvas.toBuffer();
    } catch (error) {
        console.error('Error creating welcome image:', error);
        throw error;
    }
}

module.exports = { createWelcomeImage };
