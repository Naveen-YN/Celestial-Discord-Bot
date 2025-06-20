// Dashboard functionality
class BotDashboard {
    constructor() {
        this.init();
        this.loadBotStats();
        this.setupEventListeners();
    }

    init() {
        // Initialize tab functionality
        this.setupTabs();
        this.setupEmbedBuilder();
        this.setupWelcomeConfig();
    }

    setupTabs() {
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetTab = item.getAttribute('data-tab');

                // Remove active class from all nav items
                navItems.forEach(nav => nav.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');

                // Hide all tab contents
                tabContents.forEach(content => content.style.display = 'none');
                // Show target tab content
                document.getElementById(targetTab).style.display = 'block';

                // Update page title
                const pageTitle = document.querySelector('.page-title');
                pageTitle.textContent = item.querySelector('span').textContent;

                // Load specific data for certain tabs
                if (targetTab === 'commands') {
                    this.loadCommandUsageChart();
                } else if (targetTab === 'settings') {
                    this.loadRolePermissions();
                } else if (targetTab === 'custom-commands') {
                    this.loadCustomCommands();
                } else if (targetTab === 'messages') {
                    this.loadBotMessages();
                } else if (targetTab === 'logs') {
                    this.loadServerLogs();
                }
            });
        });
    }

    setupEmbedBuilder() {
        const embedForm = document.getElementById('embedForm');
        const previewContainer = document.getElementById('embedPreviewContainer');
        const addFieldBtn = document.getElementById('addField');
        const previewBtn = document.getElementById('previewEmbed');
        const sendBtn = document.getElementById('sendEmbed');
        const exportBtn = document.getElementById('exportEmbed');

        // Add field functionality
        addFieldBtn.addEventListener('click', () => {
            const fieldsContainer = document.getElementById('embedFields');
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'field-group';
            fieldGroup.innerHTML = `
                <input type="text" placeholder="Field name" class="field-name">
                <textarea placeholder="Field value" class="field-value" rows="2"></textarea>
                <label class="checkbox-label">
                    <input type="checkbox" class="field-inline"> Inline
                </label>
                <button type="button" class="btn-danger remove-field">Remove</button>
            `;
            fieldsContainer.appendChild(fieldGroup);

            // Add remove functionality
            fieldGroup.querySelector('.remove-field').addEventListener('click', () => {
                fieldGroup.remove();
            });
        });

        // Real-time preview
        const inputs = embedForm.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateEmbedPreview();
            });
        });

        // Preview button
        previewBtn.addEventListener('click', () => {
            this.updateEmbedPreview();
        });

        // Send embed button
        sendBtn.addEventListener('click', () => {
            this.sendEmbed();
        });

        // Export button
        exportBtn.addEventListener('click', () => {
            this.exportEmbed();
        });

        // Template functionality
        const saveTemplateBtn = document.getElementById('saveTemplate');
        const loadTemplateBtn = document.getElementById('loadTemplate');
        const templateSelect = document.getElementById('templateSelect');

        saveTemplateBtn.addEventListener('click', () => {
            this.saveEmbedTemplate();
        });

        loadTemplateBtn.addEventListener('click', () => {
            this.loadEmbedTemplate();
        });

        // Load templates on init
        this.loadEmbedTemplates();
    }

    updateEmbedPreview() {
        const title = document.getElementById('embedTitle').value;
        const description = document.getElementById('embedDescription').value;
        const color = document.getElementById('embedColor').value;
        const url = document.getElementById('embedUrl').value;
        const image = document.getElementById('embedImage').value;
        const thumbnail = document.getElementById('embedThumbnail').value;
        const footer = document.getElementById('embedFooter').value;
        const footerIcon = document.getElementById('embedFooterIcon').value;

        const previewContainer = document.getElementById('embedPreviewContainer');
        
        let embedHTML = `<div class="discord-embed" style="border-left-color: ${color}">`;
        
        if (thumbnail) {
            embedHTML += `<img src="${thumbnail}" class="embed-thumbnail" onerror="this.style.display='none'">`;
        }
        
        embedHTML += '<div class="embed-content">';
        
        if (title) {
            embedHTML += `<div class="embed-title">${url ? `<a href="${url}" style="color: #00aff4; text-decoration: none;">${title}</a>` : title}</div>`;
        }
        
        if (description) {
            embedHTML += `<div class="embed-description">${description}</div>`;
        }
        
        // Add fields
        const fieldGroups = document.querySelectorAll('.field-group');
        fieldGroups.forEach(group => {
            const name = group.querySelector('.field-name').value;
            const value = group.querySelector('.field-value').value;
            const inline = group.querySelector('.field-inline').checked;
            
            if (name && value) {
                embedHTML += `
                    <div class="embed-field" style="${inline ? 'display: inline-block; width: 33%; margin-right: 1rem;' : ''}">
                        <div class="embed-field-name">${name}</div>
                        <div class="embed-field-value">${value}</div>
                    </div>
                `;
            }
        });
        
        if (image) {
            embedHTML += `<img src="${image}" class="embed-image" onerror="this.style.display='none'">`;
        }
        
        if (footer) {
            embedHTML += `
                <div class="embed-footer">
                    ${footerIcon ? `<img src="${footerIcon}" class="embed-footer-icon" onerror="this.style.display='none'">` : ''}
                    ${footer}
                </div>
            `;
        }
        
        embedHTML += '</div></div>';
        
        previewContainer.innerHTML = embedHTML;
    }

    sendEmbed() {
        const embedData = this.getEmbedData();
        const channelId = document.getElementById('targetChannel').value;
        
        if (!channelId) {
            this.showNotification('Please select a channel to send the embed', 'warning');
            return;
        }
        
        // Send to bot API
        fetch('/api/send-embed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ embedData, channelId })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('Embed sent successfully!', 'success');
            } else {
                this.showNotification('Failed to send embed: ' + data.error, 'error');
            }
        })
        .catch(error => {
            this.showNotification('Error sending embed: ' + error.message, 'error');
        });
    }

    exportEmbed() {
        const embedData = this.getEmbedData();
        const jsonString = JSON.stringify(embedData, null, 2);
        
        // Create download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'embed.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Embed exported successfully!', 'success');
    }

    getEmbedData() {
        const embedData = {
            title: document.getElementById('embedTitle').value,
            description: document.getElementById('embedDescription').value,
            color: document.getElementById('embedColor').value,
            url: document.getElementById('embedUrl').value,
            image: document.getElementById('embedImage').value,
            thumbnail: document.getElementById('embedThumbnail').value,
            footer: {
                text: document.getElementById('embedFooter').value,
                icon_url: document.getElementById('embedFooterIcon').value
            },
            fields: []
        };

        // Get fields
        const fieldGroups = document.querySelectorAll('.field-group');
        fieldGroups.forEach(group => {
            const name = group.querySelector('.field-name').value;
            const value = group.querySelector('.field-value').value;
            const inline = group.querySelector('.field-inline').checked;
            
            if (name && value) {
                embedData.fields.push({ name, value, inline });
            }
        });

        return embedData;
    }

    setupWelcomeConfig() {
        const saveBtn = document.getElementById('saveWelcomeConfig');
        const testBtn = document.getElementById('testWelcome');

        saveBtn.addEventListener('click', () => {
            this.saveWelcomeConfig();
        });

        testBtn.addEventListener('click', () => {
            this.testWelcomeMessage();
        });

        // Load channels
        this.loadChannels();
    }

    saveWelcomeConfig() {
        const configData = {
            channel: document.getElementById('welcomeChannel').value,
            style: document.getElementById('welcomeStyle').value,
            message: document.getElementById('welcomeMessage').value,
            color: document.getElementById('welcomeColor').value,
            image: document.getElementById('welcomeImage').value,
            thumbnail: document.getElementById('welcomeThumbnail').value,
            footer: document.getElementById('welcomeFooter').value
        };

        fetch('/api/welcome-config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(configData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('Welcome configuration saved!', 'success');
            } else {
                this.showNotification('Failed to save configuration: ' + data.error, 'error');
            }
        })
        .catch(error => {
            this.showNotification('Error saving configuration: ' + error.message, 'error');
        });
    }

    testWelcomeMessage() {
        fetch('/api/test-welcome', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('Test welcome message sent!', 'success');
            } else {
                this.showNotification('Failed to send test message: ' + data.error, 'error');
            }
        })
        .catch(error => {
            this.showNotification('Error sending test message: ' + error.message, 'error');
        });
    }

    loadChannels() {
        fetch('/api/channels')
        .then(response => response.json())
        .then(data => {
            const welcomeChannelSelect = document.getElementById('welcomeChannel');
            const targetChannelSelect = document.getElementById('targetChannel');
            
            // Clear existing options
            welcomeChannelSelect.innerHTML = '<option value="">Select a channel...</option>';
            targetChannelSelect.innerHTML = '<option value="">Select a channel to send embed...</option>';
            
            if (data.channels) {
                data.channels.forEach(channel => {
                    // Welcome channel option
                    const welcomeOption = document.createElement('option');
                    welcomeOption.value = channel.id;
                    welcomeOption.textContent = `#${channel.name} (${channel.guild})`;
                    welcomeChannelSelect.appendChild(welcomeOption);
                    
                    // Target channel option for embed
                    const targetOption = document.createElement('option');
                    targetOption.value = channel.id;
                    targetOption.textContent = `#${channel.name} (${channel.guild})`;
                    targetChannelSelect.appendChild(targetOption);
                });
            }
        })
        .catch(error => {
            console.error('Error loading channels:', error);
        });
    }

    loadBotStats() {
        // Load bot stats
        fetch('/api/bot-stats')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('server-count').textContent = data.stats.servers || '0';
                document.getElementById('user-count').textContent = data.stats.users || '0';
                document.getElementById('uptime').textContent = this.formatUptime(data.stats.uptime || 0);
            }
        })
        .catch(error => {
            console.error('Error loading bot stats:', error);
        });

        // Load bot user info
        fetch('/api/user-info')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('bot-name').textContent = data.user.username;
                document.getElementById('bot-tag').textContent = data.user.tag;
                document.getElementById('bot-avatar').src = data.user.avatar;
            }
        })
        .catch(error => {
            console.error('Error loading bot user info:', error);
        });

        // Load servers
        this.loadServers();

        // Load analytics
        this.loadAnalytics();
    }

    loadServers() {
        fetch('/api/servers')
        .then(response => response.json())
        .then(data => {
            const serversList = document.getElementById('servers-list');
            
            if (data.success && data.servers.length > 0) {
                serversList.innerHTML = '';
                data.servers.forEach(server => {
                    const serverCard = document.createElement('div');
                    serverCard.className = 'server-card';
                    
                    const iconContent = server.icon ? 
                        `<img src="${server.icon}" alt="${server.name}">` :
                        server.name.charAt(0).toUpperCase();
                    
                    serverCard.innerHTML = `
                        <div class="server-icon">${iconContent}</div>
                        <div class="server-info">
                            <h3>${server.name}</h3>
                            <p>${server.memberCount} members</p>
                        </div>
                    `;
                    
                    serversList.appendChild(serverCard);
                });
            } else {
                serversList.innerHTML = '<div class="loading-message">No servers found</div>';
            }
        })
        .catch(error => {
            console.error('Error loading servers:', error);
            document.getElementById('servers-list').innerHTML = '<div class="loading-message">Error loading servers</div>';
        });
    }

    loadAnalytics() {
        // Load command statistics
        fetch('/api/command-stats')
        .then(response => response.json())
        .then(data => {
            const topCommandsContainer = document.getElementById('top-commands');
            
            if (data.success && data.stats.length > 0) {
                topCommandsContainer.innerHTML = '';
                data.stats.slice(0, 5).forEach(stat => {
                    const item = document.createElement('div');
                    item.className = 'command-stat-item';
                    item.innerHTML = `
                        <span class="command-stat-name">/${stat.commandName}</span>
                        <span class="command-stat-count">${stat.count}</span>
                    `;
                    topCommandsContainer.appendChild(item);
                });
            } else {
                topCommandsContainer.innerHTML = '<div class="loading-message">No command data available</div>';
            }
        })
        .catch(error => {
            console.error('Error loading command stats:', error);
            document.getElementById('top-commands').innerHTML = '<div class="loading-message">Error loading data</div>';
        });

        // Load moderation activity (example data for now)
        const moderationContainer = document.getElementById('moderation-activity');
        moderationContainer.innerHTML = `
            <div class="moderation-stat-item">
                <span class="moderation-action">Warnings</span>
                <span class="moderation-count">0</span>
            </div>
            <div class="moderation-stat-item">
                <span class="moderation-action">Bans</span>
                <span class="moderation-count">0</span>
            </div>
            <div class="moderation-stat-item">
                <span class="moderation-action">Kicks</span>
                <span class="moderation-count">0</span>
            </div>
        `;
    }

    loadEmbedTemplates() {
        fetch('/api/embed-templates')
        .then(response => response.json())
        .then(data => {
            const templateSelect = document.getElementById('templateSelect');
            templateSelect.innerHTML = '<option value="">Select a template...</option>';
            
            if (data.success && data.templates) {
                data.templates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = template.name;
                    option.dataset.embedData = JSON.stringify(template.embedData);
                    templateSelect.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error loading embed templates:', error);
        });
    }

    saveEmbedTemplate() {
        const templateName = document.getElementById('templateName').value;
        if (!templateName) {
            this.showNotification('Please enter a template name', 'warning');
            return;
        }

        const embedData = this.getEmbedData();
        
        fetch('/api/embed-templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: templateName,
                embedData: embedData,
                createdBy: 'dashboard-user'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('Template saved successfully!', 'success');
                document.getElementById('templateName').value = '';
                this.loadEmbedTemplates();
            } else {
                this.showNotification('Failed to save template: ' + data.error, 'error');
            }
        })
        .catch(error => {
            this.showNotification('Error saving template: ' + error.message, 'error');
        });
    }

    loadEmbedTemplate() {
        const templateSelect = document.getElementById('templateSelect');
        const selectedOption = templateSelect.options[templateSelect.selectedIndex];
        
        if (!selectedOption.value) {
            this.showNotification('Please select a template to load', 'warning');
            return;
        }

        try {
            const embedData = JSON.parse(selectedOption.dataset.embedData);
            
            // Populate form with template data
            document.getElementById('embedTitle').value = embedData.title || '';
            document.getElementById('embedDescription').value = embedData.description || '';
            document.getElementById('embedColor').value = embedData.color || '#0099ff';
            document.getElementById('embedUrl').value = embedData.url || '';
            document.getElementById('embedImage').value = embedData.image || '';
            document.getElementById('embedThumbnail').value = embedData.thumbnail || '';
            document.getElementById('embedFooter').value = embedData.footer?.text || '';
            document.getElementById('embedFooterIcon').value = embedData.footer?.icon_url || '';
            
            // Clear existing fields and add template fields
            const fieldsContainer = document.getElementById('embedFields');
            fieldsContainer.innerHTML = '';
            
            if (embedData.fields && embedData.fields.length > 0) {
                embedData.fields.forEach(field => {
                    const fieldGroup = document.createElement('div');
                    fieldGroup.className = 'field-group';
                    fieldGroup.innerHTML = `
                        <input type="text" placeholder="Field name" class="field-name" value="${field.name}">
                        <textarea placeholder="Field value" class="field-value" rows="2">${field.value}</textarea>
                        <label class="checkbox-label">
                            <input type="checkbox" class="field-inline" ${field.inline ? 'checked' : ''}> Inline
                        </label>
                        <button type="button" class="btn-danger remove-field">Remove</button>
                    `;
                    fieldsContainer.appendChild(fieldGroup);

                    // Add remove functionality
                    fieldGroup.querySelector('.remove-field').addEventListener('click', () => {
                        fieldGroup.remove();
                    });
                });
            }

            this.updateEmbedPreview();
            this.showNotification('Template loaded successfully!', 'success');
        } catch (error) {
            this.showNotification('Error loading template: ' + error.message, 'error');
        }
    }

    loadCommandUsageChart() {
        fetch('/api/command-stats')
        .then(response => response.json())
        .then(data => {
            const chartContainer = document.getElementById('command-usage-chart');
            
            if (data.success && data.stats.length > 0) {
                chartContainer.innerHTML = '';
                
                // Find max count for scaling
                const maxCount = Math.max(...data.stats.map(stat => stat.count));
                
                data.stats.slice(0, 10).forEach(stat => {
                    const percentage = (stat.count / maxCount) * 100;
                    
                    const usageBar = document.createElement('div');
                    usageBar.className = 'usage-bar';
                    usageBar.innerHTML = `
                        <div class="usage-command">/${stat.commandName}</div>
                        <div class="usage-progress">
                            <div class="usage-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="usage-count">${stat.count}</div>
                    `;
                    
                    chartContainer.appendChild(usageBar);
                });
            } else {
                chartContainer.innerHTML = '<div class="loading-message">No command usage data available</div>';
            }
        })
        .catch(error => {
            console.error('Error loading command usage chart:', error);
            document.getElementById('command-usage-chart').innerHTML = '<div class="loading-message">Error loading data</div>';
        });
    }

    loadRolePermissions() {
        fetch('/api/role-permissions')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.updateRolePermissionsDisplay(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading role permissions:', error);
        });
    }

    updateRolePermissionsDisplay(permissionData) {
        // Update the role hierarchy display with actual command counts
        const commandsByLevel = {};
        
        // Group commands by required level
        Object.entries(permissionData.commandPermissions).forEach(([command, level]) => {
            if (!commandsByLevel[level]) {
                commandsByLevel[level] = [];
            }
            commandsByLevel[level].push(command);
        });

        // Update role descriptions with actual command lists
        const roleLevels = document.querySelectorAll('.role-level');
        roleLevels.forEach(roleElement => {
            const className = roleElement.className.split(' ')[1];
            let level = null;
            
            switch (className) {
                case 'owner': level = permissionData.hierarchy.OWNER; break;
                case 'admin': level = permissionData.hierarchy.ADMIN; break;
                case 'moderator': level = permissionData.hierarchy.MODERATOR; break;
                case 'junior-mod': level = permissionData.hierarchy.JUNIOR_MOD; break;
                case 'helper': level = permissionData.hierarchy.HELPER; break;
                case 'member': level = permissionData.hierarchy.MEMBER; break;
            }
            
            if (level !== null) {
                const commands = commandsByLevel[level] || [];
                const descElement = roleElement.querySelector('.role-desc');
                
                if (commands.length > 0) {
                    const commandText = commands.map(cmd => `/${cmd}`).join(', ');
                    descElement.textContent = commandText + (level > 0 ? ' + all below' : '');
                } else if (level === permissionData.hierarchy.OWNER) {
                    descElement.textContent = 'Full access to all commands';
                } else {
                    descElement.textContent = 'Basic info commands';
                }
            }
        });
    }

    // Custom Commands Management
    loadCustomCommands() {
        fetch('/api/custom-commands')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.displayCustomCommands(data.commands);
            }
        })
        .catch(error => {
            console.error('Error loading custom commands:', error);
            document.getElementById('custom-commands-list').innerHTML = '<div class="error-message">Error loading commands</div>';
        });
    }

    displayCustomCommands(commands) {
        const container = document.getElementById('custom-commands-list');
        
        if (!commands || commands.length === 0) {
            container.innerHTML = '<div class="empty-state">No custom commands created yet. Click "Create Command" to get started!</div>';
            return;
        }

        container.innerHTML = commands.map(command => `
            <div class="command-card" data-command-id="${command.id}">
                <div class="command-header">
                    <div class="command-info">
                        <h4>/${command.commandName}</h4>
                        <p>${command.description || 'No description'}</p>
                    </div>
                    <div class="command-actions">
                        <span class="command-usage">${command.usageCount} uses</span>
                        <span class="command-permission">${command.permissions}</span>
                        <button class="btn btn-small btn-secondary" onclick="dashboard.editCommand(${command.id})">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="dashboard.deleteCommand(${command.id})">Delete</button>
                        <label class="toggle-switch">
                            <input type="checkbox" ${command.isEnabled ? 'checked' : ''} onchange="dashboard.toggleCommand(${command.id}, this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="command-preview">
                    <strong>Response:</strong> 
                    ${command.responseType === 'embed' 
                        ? `<span class="embed-preview">Embed: ${command.embedData?.title || 'Untitled'}</span>`
                        : `<span class="text-preview">${command.response.substring(0, 100)}${command.response.length > 100 ? '...' : ''}</span>`
                    }
                </div>
            </div>
        `).join('');
    }

    showCreateCommandModal() {
        document.getElementById('command-modal-title').textContent = 'Create Custom Command';
        document.getElementById('command-form').reset();
        document.getElementById('command-modal').style.display = 'flex';
        this.currentEditingCommand = null;
    }

    editCommand(commandId) {
        // Find command data and populate form
        fetch('/api/custom-commands')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const command = data.commands.find(c => c.id === commandId);
                if (command) {
                    this.populateCommandForm(command);
                    document.getElementById('command-modal-title').textContent = 'Edit Custom Command';
                    document.getElementById('command-modal').style.display = 'flex';
                    this.currentEditingCommand = commandId;
                }
            }
        });
    }

    populateCommandForm(command) {
        document.getElementById('command-name').value = command.commandName;
        document.getElementById('command-description').value = command.description || '';
        document.getElementById('command-response-type').value = command.responseType;
        document.getElementById('command-permissions').value = command.permissions;
        
        if (command.responseType === 'embed' && command.embedData) {
            document.getElementById('embed-title').value = command.embedData.title || '';
            document.getElementById('embed-description').value = command.embedData.description || '';
            document.getElementById('embed-color').value = command.embedData.color || '#5865f2';
            document.getElementById('embed-thumbnail').value = command.embedData.thumbnail?.url || '';
        } else {
            document.getElementById('command-response').value = command.response;
        }
        
        this.toggleResponseType();
    }

    toggleResponseType() {
        const responseType = document.getElementById('command-response-type').value;
        const textGroup = document.getElementById('text-response-group');
        const embedGroup = document.getElementById('embed-response-group');
        
        if (responseType === 'embed') {
            textGroup.style.display = 'none';
            embedGroup.style.display = 'block';
        } else {
            textGroup.style.display = 'block';
            embedGroup.style.display = 'none';
        }
    }

    toggleMessageType() {
        const messageType = document.querySelector('input[name="messageType"]:checked').value;
        const textForm = document.getElementById('text-message-form');
        const embedForm = document.getElementById('embed-form');
        
        if (messageType === 'text') {
            textForm.style.display = 'block';
            embedForm.style.display = 'none';
        } else {
            textForm.style.display = 'none';
            embedForm.style.display = 'block';
        }
    }

    async sendTextMessage() {
        const content = document.getElementById('textMessage').value;
        const channelId = document.getElementById('channelSelect').value;
        
        if (!content || !channelId) {
            this.showNotification('Please enter message content and select a channel', 'error');
            return;
        }

        try {
            const response = await fetch('/api/send-text-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content,
                    channelId
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Message sent successfully!', 'success');
                document.getElementById('textMessage').value = '';
                // Refresh bot messages if on that tab
                if (document.getElementById('messages').style.display !== 'none') {
                    this.loadBotMessages();
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    closeCommandModal() {
        document.getElementById('command-modal').style.display = 'none';
        this.currentEditingCommand = null;
    }

    async saveCommand(formData) {
        const commandData = {
            commandName: formData.get('command-name'),
            description: formData.get('command-description'),
            responseType: formData.get('response-type'),
            permissions: formData.get('permissions'),
            createdBy: 'dashboard' // You might want to track the actual user
        };

        if (commandData.responseType === 'embed') {
            commandData.embedData = {
                title: document.getElementById('embed-title').value,
                description: document.getElementById('embed-description').value,
                color: document.getElementById('embed-color').value,
                thumbnail: document.getElementById('embed-thumbnail').value ? 
                    { url: document.getElementById('embed-thumbnail').value } : null
            };
            commandData.response = 'Embed message';
        } else {
            commandData.response = formData.get('response');
        }

        const url = this.currentEditingCommand 
            ? `/api/custom-commands/${this.currentEditingCommand}`
            : '/api/custom-commands';
        
        const method = this.currentEditingCommand ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commandData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Command ${this.currentEditingCommand ? 'updated' : 'created'} successfully!`, 'success');
                this.closeCommandModal();
                this.loadCustomCommands();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    async deleteCommand(commandId) {
        if (!confirm('Are you sure you want to delete this command?')) return;

        try {
            const response = await fetch(`/api/custom-commands/${commandId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Command deleted successfully!', 'success');
                this.loadCustomCommands();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    async toggleCommand(commandId, isEnabled) {
        try {
            const response = await fetch(`/api/custom-commands/${commandId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isEnabled })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Command ${isEnabled ? 'enabled' : 'disabled'}!`, 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    // Bot Messages Management
    loadBotMessages() {
        const guildId = 'current'; // You might want to make this dynamic
        fetch(`/api/bot-messages?guildId=${guildId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.displayBotMessages(data.messages);
            }
        })
        .catch(error => {
            console.error('Error loading bot messages:', error);
            document.getElementById('messages-list').innerHTML = '<div class="error-message">Error loading messages</div>';
        });
    }

    displayBotMessages(messages) {
        const container = document.getElementById('messages-list');
        
        if (!messages || messages.length === 0) {
            container.innerHTML = '<div class="empty-state">No bot messages found.</div>';
            return;
        }

        container.innerHTML = messages.map(message => `
            <div class="message-card" data-message-id="${message.messageId}">
                <div class="message-header">
                    <div class="message-info">
                        <h4>${message.messageType.replace('_', ' ').toUpperCase()}</h4>
                        <p class="message-timestamp">${new Date(message.sentAt).toLocaleString()}</p>
                    </div>
                    <div class="message-actions">
                        <button class="btn btn-small btn-secondary" onclick="dashboard.editMessage('${message.messageId}')">Edit</button>
                        <button class="btn btn-small btn-danger" onclick="dashboard.deleteMessage('${message.messageId}')">Delete</button>
                    </div>
                </div>
                <div class="message-content">
                    ${message.content || ''}
                    ${message.embedData ? '<div class="embed-indicator">📎 Contains embed</div>' : ''}
                </div>
            </div>
        `).join('');
    }

    editMessage(messageId) {
        // Fetch message data and show edit modal
        fetch(`/api/bot-messages?messageId=${messageId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.messages.length > 0) {
                const message = data.messages[0];
                this.populateMessageForm(message);
                document.getElementById('message-modal').style.display = 'flex';
                this.currentEditingMessage = messageId;
            }
        });
    }

    populateMessageForm(message) {
        document.getElementById('edit-message-content').value = message.content || '';
        
        if (message.embedData) {
            document.getElementById('edit-embed-group').style.display = 'block';
            document.getElementById('edit-embed-title').value = message.embedData.title || '';
            document.getElementById('edit-embed-description').value = message.embedData.description || '';
            document.getElementById('edit-embed-color').value = message.embedData.color || '#5865f2';
        } else {
            document.getElementById('edit-embed-group').style.display = 'none';
        }
    }

    closeMessageModal() {
        document.getElementById('message-modal').style.display = 'none';
        this.currentEditingMessage = null;
    }

    async updateMessage(formData) {
        const updateData = {
            content: formData.get('message-content')
        };

        const embedTitle = document.getElementById('edit-embed-title').value;
        const embedDescription = document.getElementById('edit-embed-description').value;
        
        if (embedTitle || embedDescription) {
            updateData.embedData = {
                title: embedTitle,
                description: embedDescription,
                color: document.getElementById('edit-embed-color').value
            };
        }

        try {
            const response = await fetch(`/api/bot-messages/${this.currentEditingMessage}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Message updated successfully!', 'success');
                this.closeMessageModal();
                this.loadBotMessages();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    async deleteMessage(messageId = this.currentEditingMessage) {
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            const response = await fetch(`/api/bot-messages/${messageId}`, {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Message deleted successfully!', 'success');
                if (this.currentEditingMessage) this.closeMessageModal();
                this.loadBotMessages();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    refreshMessages() {
        this.loadBotMessages();
    }

    // Server Logs Management
    loadServerLogs() {
        const logType = document.getElementById('log-type-filter')?.value || 'all';
        const logDate = document.getElementById('log-date-filter')?.value;
        
        let url = '/api/server-logs?';
        if (logType !== 'all') url += `type=${logType}&`;
        if (logDate) url += `date=${logDate}&`;
        
        fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.displayServerLogs(data.logs);
                this.updateLogsStats(data.stats);
            }
        })
        .catch(error => {
            console.error('Error loading server logs:', error);
            document.getElementById('logs-list').innerHTML = '<div class="error-message">Error loading logs</div>';
        });
    }

    displayServerLogs(logs) {
        const container = document.getElementById('logs-list');
        
        if (!logs || logs.length === 0) {
            container.innerHTML = '<div class="empty-state">No logs found for the selected filters.</div>';
            return;
        }

        container.innerHTML = logs.map(log => {
            const logIcon = this.getLogIcon(log.type);
            const logColor = this.getLogColor(log.type);
            
            return `
                <div class="log-entry" style="border-left-color: ${logColor}">
                    <div class="log-header">
                        <div class="log-info">
                            <span class="log-icon">${logIcon}</span>
                            <span class="log-type">${log.type.replace('_', ' ').toUpperCase()}</span>
                            <span class="log-timestamp">${new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <div class="log-user">
                            ${log.moderator ? `by ${log.moderator}` : ''}
                        </div>
                    </div>
                    <div class="log-content">
                        <div class="log-action">${log.action}</div>
                        ${log.target ? `<div class="log-target">Target: ${log.target}</div>` : ''}
                        ${log.reason ? `<div class="log-reason">Reason: ${log.reason}</div>` : ''}
                        ${log.details ? `<div class="log-details">${log.details}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    updateLogsStats(stats) {
        if (stats) {
            document.getElementById('total-logs').textContent = stats.totalLogs || 0;
            document.getElementById('moderation-actions').textContent = stats.moderationActions || 0;
            document.getElementById('active-warnings').textContent = stats.activeWarnings || 0;
            document.getElementById('commands-today').textContent = stats.commandsToday || 0;
        }
    }

    getLogIcon(type) {
        const icons = {
            'moderation': '🛡️',
            'commands': '⚡',
            'warnings': '⚠️',
            'role_changes': '👥',
            'ban': '🔨',
            'kick': '👢',
            'timeout': '⏰',
            'warn': '⚠️',
            'role_add': '➕',
            'role_remove': '➖'
        };
        return icons[type] || '📝';
    }

    getLogColor(type) {
        const colors = {
            'moderation': '#ff6b6b',
            'commands': '#5865f2',
            'warnings': '#ffd93d',
            'role_changes': '#57f287',
            'ban': '#dc3545',
            'kick': '#fd7e14',
            'timeout': '#6c757d',
            'warn': '#ffc107',
            'role_add': '#28a745',
            'role_remove': '#dc3545'
        };
        return colors[type] || '#6c757d';
    }

    refreshLogs() {
        this.loadServerLogs();
    }

    async clearLogs() {
        if (!confirm('Are you sure you want to clear all server logs? This action cannot be undone.')) return;

        try {
            const response = await fetch('/api/server-logs', {
                method: 'DELETE'
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('Server logs cleared successfully!', 'success');
                this.loadServerLogs();
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            mainContent.classList.toggle('sidebar-open');
        });

        // Settings
        const saveSettingsBtn = document.getElementById('saveSettings');
        const resetSettingsBtn = document.getElementById('resetSettings');

        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => {
                this.saveSettings();
            });
        }

        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        // Form submissions
        const welcomeForm = document.getElementById('welcome-form');
        if (welcomeForm) {
            welcomeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveWelcomeConfig();
            });
        }

        const commandForm = document.getElementById('command-form');
        if (commandForm) {
            commandForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                this.saveCommand(formData);
            });
        }

        const messageEditForm = document.getElementById('message-edit-form');
        if (messageEditForm) {
            messageEditForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                this.updateMessage(formData);
            });
        }

        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }
    }

    saveSettings() {
        const settingsData = {
            status: document.getElementById('botStatus').value,
            activityType: document.getElementById('activityType').value,
            activityText: document.getElementById('activityText').value
        };

        fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settingsData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                this.showNotification('Settings saved successfully!', 'success');
            } else {
                this.showNotification('Failed to save settings: ' + data.error, 'error');
            }
        })
        .catch(error => {
            this.showNotification('Error saving settings: ' + error.message, 'error');
        });
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to default?')) {
            fetch('/api/reset-settings', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    this.showNotification('Settings reset successfully!', 'success');
                    // Reload the page to show default values
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else {
                    this.showNotification('Failed to reset settings: ' + data.error, 'error');
                }
            })
            .catch(error => {
                this.showNotification('Error resetting settings: ' + error.message, 'error');
            });
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            transform: translateY(-10px);
            transition: all 0.3s ease;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#2ecc71';
                notification.style.color = '#0f1219';
                break;
            case 'error':
                notification.style.backgroundColor = '#e74c3c';
                break;
            case 'warning':
                notification.style.backgroundColor = '#e67e22';
                notification.style.color = '#0f1219';
                break;
            default:
                notification.style.backgroundColor = '#4a90e2';
        }
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BotDashboard();
});