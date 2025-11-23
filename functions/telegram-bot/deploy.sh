#!/bin/bash

# Deploy Telegram Bot Cloud Function
# This script handles the deployment with proper error checking

set -e  # Exit on any error

PROJECT_ID="${PROJECT_ID:-your-gcp-project-id}"
FUNCTION_NAME="telegram-showcase-bot"
REGION="${REGION:-us-central1}"

echo "🚀 Deploying Telegram Bot Cloud Function..."
echo "📍 Project: $PROJECT_ID"
echo "📍 Region: $REGION"
echo "📍 Function: $FUNCTION_NAME"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the functions/telegram-bot directory."
    echo "Usage: cd functions/telegram-bot && ./deploy.sh"
    exit 1
fi

# Check if gcloud is available
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Check if authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n 1 > /dev/null; then
    echo "❌ Error: Not authenticated with Google Cloud. Please run 'gcloud auth login'."
    exit 1
fi

# Set the project
echo "🔧 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Deploy the function with correct syntax
echo "📦 Deploying Cloud Function..."
gcloud functions deploy $FUNCTION_NAME \
  --region=$REGION \
  --runtime=nodejs20 \
  --trigger-http \
  --memory=512MB \
  --timeout=540s \
  --entry-point=telegramShowcaseBot \
  --set-env-vars=GOOGLE_CLOUD_PROJECT=$PROJECT_ID \
  --allow-unauthenticated \
  --source=.

if [ $? -eq 0 ]; then
    echo "✅ Cloud Function deployed successfully!"

    # Get the function URL
    FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME --region=$REGION --format="value(httpsTrigger.url)")

    if [ -n "$FUNCTION_URL" ]; then
        echo "🔗 Function URL: $FUNCTION_URL"
        echo ""
        echo "📋 Next steps:"
        echo "1. Copy the Function URL above"
        echo "2. Run: ./setup-webhook.sh"
        echo "3. Test the bot by sending /start"
    else
        echo "⚠️  Could not retrieve function URL. You may need to run setup-webhook.sh manually."
    fi
else
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi