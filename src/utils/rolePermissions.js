const { PermissionFlagsBits } = require('discord.js');

// Role hierarchy system (higher number = higher permissions)
const ROLE_HIERARCHY = {
    OWNER: 100,
    ADMIN: 90,
    MODERATOR: 70,
    SENIOR_MOD: 60,
    JUNIOR_MOD: 50,
    HELPER: 30,
    MEMBER: 10,
    EVERYONE: 0
};

// Command permissions mapping
const COMMAND_PERMISSIONS = {
    // Admin only commands
    'announcement': ROLE_HIERARCHY.ADMIN,
    'refresh': ROLE_HIERARCHY.ADMIN,
    'lockdown': ROLE_HIERARCHY.ADMIN,
    
    // Moderator and above commands
    'ban': ROLE_HIERARCHY.MODERATOR,
    'kick': ROLE_HIERARCHY.MODERATOR,
    'timeout': ROLE_HIERARCHY.JUNIOR_MOD,
    'warn': ROLE_HIERARCHY.JUNIOR_MOD,
    'purge': ROLE_HIERARCHY.MODERATOR,
    
    // Helper and above commands
    'welcome': ROLE_HIERARCHY.HELPER,
    'autorole': ROLE_HIERARCHY.HELPER,
    
    // Everyone can use
    'ping': ROLE_HIERARCHY.EVERYONE,
    'help': ROLE_HIERARCHY.EVERYONE,
    'avatar': ROLE_HIERARCHY.EVERYONE,
    'userinfo': ROLE_HIERARCHY.EVERYONE,
    'serverinfo': ROLE_HIERARCHY.MEMBER,
    'channelinfo': ROLE_HIERARCHY.MEMBER,
    'role': ROLE_HIERARCHY.MEMBER,
    'stats': ROLE_HIERARCHY.MEMBER,
    'embed': ROLE_HIERARCHY.HELPER
};

// Default role names that map to hierarchy levels
const DEFAULT_ROLE_NAMES = {
    [ROLE_HIERARCHY.ADMIN]: ['admin', 'administrator', 'owner'],
    [ROLE_HIERARCHY.MODERATOR]: ['moderator', 'mod', 'staff'],
    [ROLE_HIERARCHY.SENIOR_MOD]: ['senior mod', 'senior moderator', 'head mod'],
    [ROLE_HIERARCHY.JUNIOR_MOD]: ['junior mod', 'trial mod', 'trainee mod'],
    [ROLE_HIERARCHY.HELPER]: ['helper', 'support', 'assistant'],
    [ROLE_HIERARCHY.MEMBER]: ['member', 'verified', 'regular']
};

/**
 * Get the highest role level for a member
 * @param {GuildMember} member - Discord guild member
 * @returns {number} - Role hierarchy level
 */
function getMemberRoleLevel(member) {
    // Server owner always has highest permissions
    if (member.guild.ownerId === member.id) {
        return ROLE_HIERARCHY.OWNER;
    }
    
    // Check for Administrator permission
    if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        return ROLE_HIERARCHY.ADMIN;
    }
    
    let highestLevel = ROLE_HIERARCHY.EVERYONE;
    
    // Check each role against our hierarchy
    member.roles.cache.forEach(role => {
        const roleName = role.name.toLowerCase();
        
        // Check against default role names
        for (const [level, names] of Object.entries(DEFAULT_ROLE_NAMES)) {
            if (names.some(name => roleName.includes(name))) {
                highestLevel = Math.max(highestLevel, parseInt(level));
            }
        }
        
        // Check for specific permissions that indicate mod roles
        if (role.permissions.has(PermissionFlagsBits.BanMembers) || 
            role.permissions.has(PermissionFlagsBits.KickMembers)) {
            highestLevel = Math.max(highestLevel, ROLE_HIERARCHY.MODERATOR);
        }
        
        if (role.permissions.has(PermissionFlagsBits.ManageMessages) ||
            role.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            highestLevel = Math.max(highestLevel, ROLE_HIERARCHY.JUNIOR_MOD);
        }
        
        if (role.permissions.has(PermissionFlagsBits.ManageRoles) ||
            role.permissions.has(PermissionFlagsBits.ManageChannels)) {
            highestLevel = Math.max(highestLevel, ROLE_HIERARCHY.HELPER);
        }
    });
    
    return highestLevel;
}

/**
 * Check if a member has permission to use a command
 * @param {GuildMember} member - Discord guild member
 * @param {string} commandName - Name of the command
 * @returns {boolean} - Whether the member can use the command
 */
function hasCommandPermission(member, commandName) {
    const requiredLevel = COMMAND_PERMISSIONS[commandName] || ROLE_HIERARCHY.EVERYONE;
    const memberLevel = getMemberRoleLevel(member);
    
    return memberLevel >= requiredLevel;
}

/**
 * Get required role level for a command
 * @param {string} commandName - Name of the command
 * @returns {number} - Required role hierarchy level
 */
function getRequiredRoleLevel(commandName) {
    return COMMAND_PERMISSIONS[commandName] || ROLE_HIERARCHY.EVERYONE;
}

/**
 * Get role level name from hierarchy value
 * @param {number} level - Role hierarchy level
 * @returns {string} - Human readable role level name
 */
function getRoleLevelName(level) {
    const levelNames = {
        [ROLE_HIERARCHY.OWNER]: 'Server Owner',
        [ROLE_HIERARCHY.ADMIN]: 'Administrator',
        [ROLE_HIERARCHY.MODERATOR]: 'Moderator',
        [ROLE_HIERARCHY.SENIOR_MOD]: 'Senior Moderator',
        [ROLE_HIERARCHY.JUNIOR_MOD]: 'Junior Moderator',
        [ROLE_HIERARCHY.HELPER]: 'Helper',
        [ROLE_HIERARCHY.MEMBER]: 'Member',
        [ROLE_HIERARCHY.EVERYONE]: 'Everyone'
    };
    
    return levelNames[level] || 'Unknown';
}

/**
 * Create permission error embed
 * @param {string} commandName - Name of the command
 * @param {number} userLevel - User's current role level
 * @param {number} requiredLevel - Required role level
 * @returns {Object} - Discord embed object
 */
function createPermissionErrorEmbed(commandName, userLevel, requiredLevel) {
    const { EmbedBuilder } = require('discord.js');
    
    return new EmbedBuilder()
        .setTitle('❌ Insufficient Permissions')
        .setColor('#ff0000')
        .setDescription(`You don't have permission to use the \`/${commandName}\` command.`)
        .addFields(
            { name: 'Your Role Level', value: getRoleLevelName(userLevel), inline: true },
            { name: 'Required Level', value: getRoleLevelName(requiredLevel), inline: true },
            { name: 'Contact', value: 'Please contact a server administrator if you believe this is an error.', inline: false }
        )
        .setTimestamp();
}

module.exports = {
    ROLE_HIERARCHY,
    COMMAND_PERMISSIONS,
    getMemberRoleLevel,
    hasCommandPermission,
    getRequiredRoleLevel,
    getRoleLevelName,
    createPermissionErrorEmbed
};