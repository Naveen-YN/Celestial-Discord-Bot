const { PermissionFlagsBits } = require('discord.js');

function checkPermissions(member, permissions) {
    if (!member) return false;
    return member.permissions.has(permissions);
}

function isAdmin(member) {
    return checkPermissions(member, PermissionFlagsBits.Administrator);
}

function canManageMessages(member) {
    return checkPermissions(member, PermissionFlagsBits.ManageMessages);
}

function canManageRoles(member) {
    return checkPermissions(member, PermissionFlagsBits.ManageRoles);
}

module.exports = {
    checkPermissions,
    isAdmin,
    canManageMessages,
    canManageRoles
};
