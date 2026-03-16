# 🚫 Bad Links Destroyer

A powerful, open-source Discord moderation bot designed to detect and remove **obfuscated, scam, and unauthorized links**. Using advanced normalization logic, it catches bypass attempts like zero-width spaces, homoglyphs (Cyrillic look-alikes), and markdown manipulation.

## 🚀 Features

- **Advanced Normalization**: Detects links hidden behind spaces, line breaks, bold/italic markdown, and special characters.
- **Slash Commands**: Modern and easy-to-use `/` commands.
- **Granular Immunity**: Grant immunity to specific **Roles** or **Users**.
- **Custom Bot Admins**: Allow specific roles to manage the bot without full server Administrator permissions.
- **Automatic Timeouts**: Automatically timeout users sending scam links for 1 week.
- **Admin Alerts**: Send detailed reports to a moderation channel with an instant "Revoke Timeout" button.
- **Whitelisting**: Easily allow specific domains.

## 🛠️ Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/soft4211/bad-links-destroyer.git
   cd bad-links-destroyer
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   - Rename `.env.example` to `.env`.
   - Fill in your `DISCORD_TOKEN` and `GUILD_ID`.
   - Ensure **Message Content Intent** is enabled in the [Discord Developer Portal](https://discord.com/developers/applications).

4. **Start the bot**:
   ```bash
   npm start
   ```

## 📜 Commands

### Moderation
- `/toggle-timeout <status>`: Enable/disable 1-week timeouts for scam links.
- `/set-admin-channel <channel>`: Set the channel for moderation alerts.

### Permissions & Immunity
- `/admins <status> [role] [user]`: Grant/revoke bot command access to roles/users.
- `/toggle-immunity <status> [role] [user] [admins]`: Manage who the bot ignores.

### Whitelist
- `/whitelist-add <link>`: Add a domain to the whitelist.
- `/whitelist-remove <link>`: Remove a domain from the whitelist.
- `/whitelist-list`: List all whitelisted domains.

## 💡 Troubleshooting

- **"Missing Permissions"**: Ensure the bot's role is positioned **higher** than the users it is trying to moderate (especially for timeouts).
- **Bot doesn't see messages**: Verify the **Message Content Intent** is toggled ON in the Developer Portal.

## ⚖️ License

Distributed under the MIT License. See `LICENSE` for more information.
