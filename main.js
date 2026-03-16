require('dotenv').config();
const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder, SlashCommandBuilder, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const { normalizeLink } = require('./utils');

const CONFIG_FILE = 'config.json';
const PREFIX = '!';

// Load or initialize config
let config = { 
    whitelist: [], 
    adminImmunity: true,
    immuneRoles: [],
    immuneUsers: [],
    timeoutEnabled: false,
    adminChannelId: null,
    botAdminRoles: [],
    botAdminUsers: []
};
if (fs.existsSync(CONFIG_FILE)) {
    config = { ...config, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) };
}

function saveConfig() {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4));
}

function isBotAdmin(member) {
    if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;
    if (config.botAdminUsers.includes(member.id)) return true;
    if (member.roles.cache.some(role => config.botAdminRoles.includes(role.id))) return true;
    return false;
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', async () => {
    console.log(`🚀 Logged in as ${client.user.tag}!`);
    console.log(`📡 Intents Enabled: ${client.options.intents.toString()}`);
    const hasMessageContent = (client.options.intents.bitfield & (1 << 15)) !== 0;
    console.log(`📝 Message Content Intent: ${hasMessageContent ? 'ENABLED' : 'DISABLED'}`);

    // Register Slash Commands
    const commands = [
        new SlashCommandBuilder().setName('toggle-immunity')
            .setDescription('Manage immunity from link detection')
            .addBooleanOption(option => option.setName('status').setDescription('Enable or disable immunity').setRequired(true))
            .addRoleOption(option => option.setName('role').setDescription('Role to manage immunity for'))
            .addUserOption(option => option.setName('user').setDescription('User to manage immunity for'))
            .addBooleanOption(option => option.setName('admins').setDescription('Toggle global administrator immunity')),
        new SlashCommandBuilder().setName('whitelist-add').setDescription('Add a domain to the whitelist')
            .addStringOption(option => option.setName('link').setDescription('The domain/link to whitelist').setRequired(true)),
        new SlashCommandBuilder().setName('whitelist-remove').setDescription('Remove a domain from the whitelist')
            .addStringOption(option => option.setName('link').setDescription('The domain/link to remove').setRequired(true)),
        new SlashCommandBuilder().setName('whitelist-list').setDescription('List all whitelisted domains'),
        new SlashCommandBuilder().setName('set-admin-channel').setDescription('Set the channel for moderation alerts')
            .addChannelOption(option => option.setName('channel').setDescription('The channel to send alerts to').setRequired(true)),
        new SlashCommandBuilder().setName('toggle-timeout').setDescription('Toggle automatic 1-week timeouts for scam links')
            .addBooleanOption(option => option.setName('status').setDescription('Enable or disable automatic timeouts').setRequired(true)),
        new SlashCommandBuilder().setName('admins').setDescription('Manage custom bot administrators')
            .addBooleanOption(option => option.setName('status').setDescription('Grant or revoke bot admin access').setRequired(true))
            .addRoleOption(option => option.setName('role').setDescription('Role to manage bot admin access for'))
            .addUserOption(option => option.setName('user').setDescription('User to manage bot admin access for'))
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

    try {
        if (process.env.GUILD_ID) {
            console.log('🔄 Registering guild slash commands...');
            await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commands });
            console.log('✅ Guild commands registered.');
        } else {
            console.log('🔄 Registering global slash commands...');
            await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
            console.log('✅ Global commands registered.');
        }
    } catch (error) {
        console.error('❌ Error registering slash commands:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, member } = interaction;
    const isOwnerOrAdmin = isBotAdmin(member);

    if (commandName === 'whitelist-list') {
        if (config.whitelist.length === 0) return interaction.reply('📋 Whitelist is empty.');
        const list = config.whitelist.map(link => `- \`${link}\``).join('\n');
        return interaction.reply(`📋 **Whitelisted Domains:**\n${list}`);
    }

    if (!isOwnerOrAdmin) return interaction.reply({ content: '❌ You must be a bot administrator to use this command.', ephemeral: true });

    if (commandName === 'admins') {
        const status = options.getBoolean('status');
        const role = options.getRole('role');
        const user = options.getUser('user');

        if (role) {
            if (status) {
                if (!config.botAdminRoles.includes(role.id)) config.botAdminRoles.push(role.id);
            } else {
                config.botAdminRoles = config.botAdminRoles.filter(id => id !== role.id);
            }
            saveConfig();
            return interaction.reply(`👑 Bot Admin access for role **${role.name}** is now **${status ? 'Granted' : 'Revoked'}**.`);
        }

        if (user) {
            if (status) {
                if (!config.botAdminUsers.includes(user.id)) config.botAdminUsers.push(user.id);
            } else {
                config.botAdminUsers = config.botAdminUsers.filter(id => id !== user.id);
            }
            saveConfig();
            return interaction.reply(`👑 Bot Admin access for user **${user.tag}** is now **${status ? 'Granted' : 'Revoked'}**.`);
        }

        return interaction.reply('❌ Please specify a role or user to manage bot admin access.');
    }

    if (commandName === 'toggle-immunity') {
        const status = options.getBoolean('status');
        const role = options.getRole('role');
        const user = options.getUser('user');
        const admins = options.getBoolean('admins');

        if (role) {
            if (status) {
                if (!config.immuneRoles.includes(role.id)) config.immuneRoles.push(role.id);
            } else {
                config.immuneRoles = config.immuneRoles.filter(id => id !== role.id);
            }
            saveConfig();
            return interaction.reply(`🛡️ Immunity for role **${role.name}** is now **${status ? 'Enabled' : 'Disabled'}**.`);
        }

        if (user) {
            if (status) {
                if (!config.immuneUsers.includes(user.id)) config.immuneUsers.push(user.id);
            } else {
                config.immuneUsers = config.immuneUsers.filter(id => id !== user.id);
            }
            saveConfig();
            return interaction.reply(`🛡️ Immunity for user **${user.tag}** is now **${status ? 'Enabled' : 'Disabled'}**.`);
        }

        if (admins !== null) {
            config.adminImmunity = status;
            saveConfig();
            return interaction.reply(`🛡️ Global Admin Immunity is now **${status ? 'Enabled' : 'Disabled'}**.`);
        }

        // Default to global admin immunity if no specific role/user/admins provided
        config.adminImmunity = status;
        saveConfig();
        return interaction.reply(`🛡️ Global Admin Immunity is now **${status ? 'Enabled' : 'Disabled'}**.`);
    }

    if (commandName === 'whitelist-add') {
        const link = options.getString('link');
        const normalized = normalizeLink(link);
        if (!config.whitelist.includes(normalized)) {
            config.whitelist.push(normalized);
            saveConfig();
            return interaction.reply(`✅ Added \`${normalized}\` to the whitelist.`);
        }
        return interaction.reply(`ℹ️ \`${normalized}\` is already in the whitelist.`);
    }

    if (commandName === 'whitelist-remove') {
        const link = options.getString('link');
        const normalized = normalizeLink(link);
        const index = config.whitelist.indexOf(normalized);
        if (index > -1) {
            config.whitelist.splice(index, 1);
            saveConfig();
            return interaction.reply(`🗑️ Removed \`${normalized}\` from the whitelist.`);
        }
        return interaction.reply(`ℹ️ \`${normalized}\` not found in whitelist.`);
    }

    if (commandName === 'set-admin-channel') {
        const channel = options.getChannel('channel');
        config.adminChannelId = channel.id;
        saveConfig();
        return interaction.reply(`📢 Admin alert channel set to ${channel}.`);
    }

    if (commandName === 'toggle-timeout') {
        const status = options.getBoolean('status');
        config.timeoutEnabled = status;
        saveConfig();
        return interaction.reply(`⏳ Automatic timeouts are now **${status ? 'Enabled' : 'Disabled'}** (7 days).`);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId.startsWith('revoke_timeout_')) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Only administrators can revoke timeouts.', ephemeral: true });
        }

        const userId = interaction.customId.replace('revoke_timeout_', '');
        try {
            const member = await interaction.guild.members.fetch(userId);
            await member.timeout(null, `Timeout revoked by ${interaction.user.tag}`);
            
            const editedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                .setColor(0x00FF00)
                .setTitle('✅ Timeout Revoked')
                .addFields({ name: 'Revoked By', value: `${interaction.user.tag}`, inline: true });

            await interaction.update({ embeds: [editedEmbed], components: [] });
        } catch (err) {
            console.error('Failed to revoke timeout:', err);
            interaction.reply({ content: '❌ Failed to revoke timeout. They might have already left or the timeout expired.', ephemeral: true });
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return; // Silent skip for bots
    
    if (!message.guild) {
        console.log(`[DM] Message from ${message.author.tag}: ${message.content}`);
        return;
    }

    console.log(`[MSG] #${message.channel.name} | ${message.author.tag}: ${message.content}`);

    // Handle Commands
    if (message.content.startsWith(PREFIX)) {
        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        // Normalize command name to handle both _ and -
        const command = args.shift().toLowerCase().replace(/-/g, '_');

        // Admin Only Commands
        if (isBotAdmin(message.member)) {
            if (command === 'toggle_immunity') {
                config.adminImmunity = !config.adminImmunity;
                saveConfig();
                return message.reply(`🛡️ Admin Immunity is now **${config.adminImmunity ? 'Enabled' : 'Disabled'}**.`);
            }

            if (command === 'whitelist_add') {
                const link = args[0];
                if (!link) return message.reply('❌ Please provide a link/domain.');
                const normalized = normalizeLink(link);
                if (!config.whitelist.includes(normalized)) {
                    config.whitelist.push(normalized);
                    saveConfig();
                    return message.reply(`✅ Added \`${normalized}\` to the whitelist.`);
                }
                return message.reply(`ℹ️ \`${normalized}\` is already in the whitelist.`);
            }

            if (command === 'whitelist_remove') {
                const link = args[0];
                if (!link) return message.reply('❌ Please provide a link/domain.');
                const normalized = normalizeLink(link);
                const index = config.whitelist.indexOf(normalized);
                if (index > -1) {
                    config.whitelist.splice(index, 1);
                    saveConfig();
                    return message.reply(`🗑️ Removed \`${normalized}\` from the whitelist.`);
                }
                return message.reply(`ℹ️ \`${normalized}\` not found in whitelist.`);
            }
        } else {
            // Log attempts for admin commands by non-admins
            if (['toggle_immunity', 'whitelist_add', 'whitelist_remove', 'toggle-immunity', 'whitelist-add', 'whitelist-remove'].includes(command)) {
                console.log(`[CMD] User ${message.author.tag} tried to run admin command: ${command}`);
            }
        }

        if (command === 'whitelist_list' || command === 'whitelist-list') {
            if (config.whitelist.length === 0) return message.reply('📋 Whitelist is empty.');
            const list = config.whitelist.map(link => `- \`${link}\``).join('\n');
            return message.reply(`📋 **Whitelisted Domains:**\n${list}`);
        }
    }

    // Link Detection Logic
    let isImmune = false;
    
    // 1. Check Admin Immunity
    if (config.adminImmunity && message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        isImmune = true;
    }
    
    // 2. Check User Immunity
    if (config.immuneUsers.includes(message.author.id)) {
        isImmune = true;
    }
    
    // 3. Check Role Immunity
    if (message.member.roles.cache.some(role => config.immuneRoles.includes(role.id))) {
        isImmune = true;
    }

    if (isImmune) {
        console.log(`[SKIP] Immunity triggered for ${message.author.tag}`);
        return;
    }

    const normalizedContent = normalizeLink(message.content);
    console.log(`[NORM] Normalized: ${normalizedContent}`);

    // Simple check for links in normalized content
    if (normalizedContent.includes('http://') || normalizedContent.includes('https://')) {
        let whitelisted = false;
        for (const allowed of config.whitelist) {
            if (normalizedContent.includes(allowed)) {
                whitelisted = true;
                break;
            }
        }

        if (!whitelisted) {
            console.log(`[DELETE] Unauthorized link detected from ${message.author.tag}`);
            try {
                await message.delete();
                const warning = await message.channel.send(`🚫 ${message.author}, your message contained an unauthorized or obfuscated link and was removed.`);
                setTimeout(() => warning.delete().catch(() => {}), 10000);

                // Advanced Moderation: Timeout & Alert
                if (config.adminChannelId) {
                    const adminChannel = client.channels.cache.get(config.adminChannelId);
                    if (adminChannel) {
                        const embed = new EmbedBuilder()
                            .setTitle('🚨 Scam Link Detected')
                            .setColor(0xFF0000)
                            .addFields(
                                { name: 'User', value: `${message.author} (${message.author.tag})`, inline: true },
                                { name: 'Channel', value: `${message.channel}`, inline: true },
                                { name: 'Raw Content', value: `\`\`\`${message.content.substring(0, 500)}\`\`\`` },
                                { name: 'Normalized Link', value: `\`${normalizedContent}\`` }
                            )
                            .setTimestamp();

                        const row = new ActionRowBuilder();
                        
                        if (config.timeoutEnabled) {
                            try {
                                await message.member.timeout(604800000, 'Link Destroyer: Automatic Scam Link Detection');
                                embed.setDescription('User has been timed out for **1 week**.');
                                row.addComponents(
                                    new ButtonBuilder()
                                        .setCustomId(`revoke_timeout_${message.author.id}`)
                                        .setLabel('Revoke Timeout')
                                        .setStyle(ButtonStyle.Success)
                                );
                            } catch (timeoutErr) {
                                console.error('Failed to timeout user:', timeoutErr);
                                let errorMsg = 'Failed to timeout user.';
                                if (timeoutErr.code === 50013) {
                                    errorMsg = 'Failed to timeout user: **Missing Permissions**. Ensure the bot role is HIGHER than the target in the role hierarchy.';
                                }
                                embed.setDescription(errorMsg);
                            }
                        }

                        await adminChannel.send({ embeds: [embed], components: row.components.length > 0 ? [row] : [] });
                    }
                }
            } catch (err) {
                console.error('[ERROR] Failed to handle detected link:', err);
            }
        } else {
            console.log(`[ALLOW] Whitelisted link detected from ${message.author.tag}`);
        }
    }
});

console.log('Starting Bad Links Destroyer Bot (Node.js)...');
client.login(process.env.DISCORD_TOKEN);
