# Role-Based Permissions System Test Documentation

## System Overview
The bot now implements a comprehensive role-based permissions system with automatic role detection and hierarchical access control.

## Testing Commands Added

### 1. `/roletest` - Role Detection Testing
- **Purpose**: Debug and verify role detection system
- **Access**: Everyone (for testing purposes)
- **Features**: Shows detected role level, permissions, and all user roles

### 2. `/configroles` - Role Configuration Management
- **Purpose**: Setup and manage server roles for permissions
- **Access**: Administrator only
- **Subcommands**:
  - `setup` - Creates default permission roles with proper colors and permissions
  - `assign` - Configure existing roles with permission levels
  - `view` - Display current role configuration and detection

### 3. `/setrole` - Role Management
- **Purpose**: Add/remove roles from users with logging
- **Access**: Moderator and above
- **Features**: Automatic permission checking, audit logging, reason tracking

## Permission Hierarchy (Level 0-100)

| Level | Role | Commands Available |
|-------|------|-------------------|
| 100 | Server Owner | All commands |
| 90 | Administrator | announcement, refresh, lockdown, permissions + all below |
| 70 | Moderator | ban, kick, purge, setrole + all below |
| 50 | Junior Moderator | timeout, warn + all below |
| 30 | Helper | welcome, autorole, embed + all below |
| 10 | Member | serverinfo, channelinfo, role, stats + all below |
| 0 | Everyone | ping, help, avatar, userinfo, roletest |

## Auto-Detection Keywords

The system automatically detects roles based on:

### By Name (case-insensitive, partial match):
- **Admin Level**: admin, administrator, owner, manager, leader
- **Moderator Level**: moderator, mod, staff, guardian
- **Junior Mod Level**: junior mod, trial mod, trainee mod, junior staff, trainee
- **Helper Level**: helper, support, assistant, volunteer, guide
- **Member Level**: member, verified, regular, user, citizen

### By Discord Permissions:
- **Administrator permission** → Admin level
- **Ban/Kick Members** → Moderator level
- **Moderate Members/Manage Messages** → Junior Mod level
- **Manage Roles/Channels** → Helper level

## Test Scenarios

### Scenario 1: Basic Permission Check
1. Use `/roletest` on yourself to see detected level
2. Try a command above your level - should get permission error
3. Try a command at or below your level - should work

### Scenario 2: Role Setup
1. Run `/configroles setup` as admin to create default roles
2. Use `/configroles view` to verify role detection
3. Assign roles to test users

### Scenario 3: Permission Inheritance
1. Give user "Helper" role
2. Verify they can use helper commands (embed, welcome)
3. Verify they can also use lower-level commands (ping, help)
4. Verify they cannot use higher-level commands (ban, kick)

### Scenario 4: Role Management
1. Use `/setrole add` to give someone a role
2. Check audit logs in database
3. Use `/setrole remove` to remove role
4. Verify permission changes take effect immediately

## Error Handling

The system provides clear error messages when:
- User lacks sufficient permissions
- Required role level vs current level shown
- Suggests contacting administrator

## Database Integration

All role-related actions are logged:
- Role additions/removals via `/setrole`
- Command usage statistics
- Moderation actions with role context

## Security Features

- Server owner always has highest permissions regardless of roles
- Role hierarchy prevents lower roles from managing higher roles
- Bot position in role hierarchy is respected
- Permission checks occur before command execution

## Dashboard Integration

The web dashboard shows:
- Visual role hierarchy with command assignments
- Real-time permission level detection
- Role-based command usage analytics
- Permission system overview in settings

## Cleanup Notice

The `/roletest` command is temporary for testing and can be removed after validation.