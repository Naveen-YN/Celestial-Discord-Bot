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
                notification.style.backgroundColor = '#57f287';
                notification.style.color = '#000000';
                break;
            case 'error':
                notification.style.backgroundColor = '#ed4245';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffa500';
                notification.style.color = '#000000';
                break;
            default:
                notification.style.backgroundColor = '#5865f2';
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