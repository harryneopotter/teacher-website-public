// Helper script to get Telegram user ID
// Run this locally to get your Telegram user ID

const TelegramBot = require('node-telegram-bot-api');

// Replace with your bot token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

if (BOT_TOKEN === 'YOUR_BOT_TOKEN_HERE') {
  console.log('❌ Please set your TELEGRAM_BOT_TOKEN environment variable');
  console.log('Example: export TELEGRAM_BOT_TOKEN=your_bot_token_here');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 Bot started! Send a message to the bot to get your user ID.');
console.log('Press Ctrl+C to stop.');

bot.on('message', (msg) => {
  const userId = msg.from.id;
  const firstName = msg.from.first_name || '';
  const username = msg.from.username || '';

  console.log('\n📨 Message received!');
  console.log(`👤 User: ${firstName} (@${username})`);
  console.log(`🆔 User ID: ${userId}`);
  console.log(`💬 Message: ${msg.text || 'Non-text message'}`);
  console.log('='.repeat(50));

  bot.sendMessage(msg.chat.id, `👤 **Your Telegram User ID:** \`${userId}\`\n\nUse this ID in the bot's AUTHORIZED_USERS configuration.`, {
    parse_mode: 'Markdown'
  });
});

process.on('SIGINT', () => {
  console.log('\n👋 Bot stopped. Use the user ID shown above in your bot configuration.');
  process.exit(0);
});