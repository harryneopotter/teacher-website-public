#!/bin/bash

# Setup Telegram webhook for the deployed Cloud Function
# Run this in Google Cloud Shell after deploying the function

PROJECT_ID="${PROJECT_ID:-your-gcp-project-id}"
FUNCTION_NAME="telegram-showcase-bot"
REGION="${REGION:-us-central1}"

echo "🔗 Setting up Telegram webhook..."

# Get the function URL
echo "🔍 Retrieving function URL..."
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --region=$REGION --format="value(httpsTrigger.url)" 2>/dev/null || echo "")

if [ -z "$FUNCTION_URL" ]; then
    echo "⚠️  Could not retrieve function URL automatically."
    echo "📝 Please provide the function URL manually."
    echo "💡 You can find it in the Google Cloud Console:"
    echo "   1. Go to Cloud Functions"
    echo "   2. Select your function"
    echo "   3. Copy the 'Trigger URL'"
    echo ""
    read -p "Enter the function URL: " FUNCTION_URL

    if [ -z "$FUNCTION_URL" ]; then
        echo "❌ No function URL provided. Exiting."
        exit 1
    fi
fi

echo "📡 Function URL: $FUNCTION_URL"

# Get bot token from Secret Manager
echo "🔑 Getting bot token from Secret Manager..."
BOT_TOKEN=$(gcloud secrets versions access latest --secret="telegram-bot-token")

if [ -z "$BOT_TOKEN" ]; then
    echo "❌ Could not get bot token from Secret Manager."
    exit 1
fi

# Set the webhook
echo "🚀 Setting webhook..."
WEBHOOK_URL="https://api.telegram.org/bot${BOT_TOKEN}/setWebhook"

RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "{\"url\": \"$FUNCTION_URL\"}")

echo "📋 Telegram API Response:"
echo "$RESPONSE"

# Check if successful
if echo "$RESPONSE" | grep -q '"ok":true'; then
    echo "✅ Webhook set successfully!"
    echo "🎉 Your bot is now ready to receive messages!"
    echo ""
    echo "📱 Test it by:"
    echo "1. Finding your bot on Telegram"
    echo "2. Sending /start"
    echo "3. Uploading a PDF file"
else
    echo "❌ Failed to set webhook. Check the response above."
    exit 1
fi