#!/bin/bash

# Manual webhook setup for Telegram Bot
# Run this if the automatic setup fails

echo "🤖 Telegram Bot - Manual Webhook Setup"
echo "=============================================="

# Configuration
PROJECT_ID="${PROJECT_ID:-your-gcp-project-id}"
FUNCTION_NAME="telegram-showcase-bot"
REGION="${REGION:-us-central1}"
FUNCTION_URL="https://us-central1-your-gcp-project-id.cloudfunctions.net/telegram-showcase-bot"

echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Function: $FUNCTION_NAME"
echo "   Region: $REGION"
echo "   URL: $FUNCTION_URL"
echo ""

# Get bot token
echo "🔑 Step 1: Getting bot token from Secret Manager..."
BOT_TOKEN=$(gcloud secrets versions access latest --secret="telegram-bot-token" --project=$PROJECT_ID 2>/dev/null)

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Failed to get bot token from Secret Manager"
    echo "💡 Make sure you're authenticated: gcloud auth login"
    exit 1
fi

echo "✅ Bot token retrieved successfully"
echo ""

# Set webhook
echo "🚀 Step 2: Setting up webhook..."
WEBHOOK_API_URL="https://api.telegram.org/bot${BOT_TOKEN}/setWebhook"

echo "📡 Calling Telegram API..."
RESPONSE=$(curl -s -X POST "$WEBHOOK_API_URL" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$FUNCTION_URL\"}")

echo "📋 Telegram API Response:"
echo "$RESPONSE"
echo ""

# Check if successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ SUCCESS: Webhook set up successfully!"
    echo ""
    echo "🎉 Your bot is now ready!"
    echo ""
    echo "📱 Test it by:"
    echo "1. Finding your bot on Telegram"
    echo "2. Sending /start"
    echo "3. Sending /userid to get your user ID"
    echo ""
    echo "👥 To add The Teacher as a content manager:"
    echo "1. Have her send /userid to the bot"
    echo "2. Add her user ID to the AUTHORIZED_USERS in index.js"
    echo "3. Redeploy the function"
else
    echo "❌ FAILED: Could not set up webhook"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "1. Check if the function URL is correct"
    echo "2. Verify bot token is valid"
    echo "3. Check Cloud Function logs for errors"
    echo ""
    echo "📞 Check webhook status:"
    echo "curl https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
fi