# Telegram Showcase Bot

A Telegram bot for managing student showcase content with PDF upload, metadata collection, and automatic publishing to the website.

## 📸 Bot Interface

![Telegram Bot Interface - Commands and Help](../../assets/tg-bot2.png)
*Bot commands and PDF upload workflow*

![Telegram Bot Interface - Thumbnail Upload](../../assets/tg-bot1.png)
*Thumbnail processing and upload confirmation*

## 🚀 Quick Start

### 1. Deploy the Cloud Function

```bash
# Navigate to the bot directory
cd functions/telegram-bot

# Deploy the function (Node.js 20)
./deploy.sh
```

**Note:** Updated to Node.js 20 (latest LTS) for better performance and security.
```

### 2. Setup Webhook

**Option A: Automatic Setup (Recommended)**
```bash
# Setup Telegram webhook (run after deployment)
./setup-webhook-manual.sh
```

**Option B: Interactive Setup (if automatic fails)**
```bash
# Setup with manual URL input
./setup-webhook.sh
```

### 3. Get Your User ID

**Option A: Use the bot command**
Send `/userid` to the bot to get your Telegram user ID.

**Option B: Use the helper script**
```bash
export TELEGRAM_BOT_TOKEN=your_bot_token_here
npm run get-userid
```

### 4. Update Authorized Users

Edit `index.js` and replace the user ID:
```javascript
const AUTHORIZED_USERS = {
  'YOUR_ACTUAL_USER_ID': 'admin', // Replace with your ID
};
```

## 📋 Available Commands

- `/start` - Initialize the bot and see welcome message
- `/help` - Show help and available commands
- `/list` - View all published showcase items
- `/status` - Check bot status and your role
- `/userid` - Get your Telegram user ID
- `/cancel` - Cancel current PDF upload process
- Send PDF files to add new student work (max 20MB)

## 📄 PDF Upload Limits

**File Size Limits:**
- **Maximum PDF size**: 20MB (Telegram bot limit)
- **Recommended size**: Under 10MB for faster processing
- **Memory available**: 512MB for processing
- **Timeout limit**: 9 minutes (540 seconds)

**Processing Time:**
- Small PDFs (< 5MB): 30-60 seconds
- Medium PDFs (5-15MB): 2-5 minutes
- Large PDFs (15-20MB): 5-9 minutes

**Cancellation:**
- Send `/cancel` at any time to stop the current upload process
- You can restart by sending a new PDF file
- Cancellation is immediate and safe

## 🔧 Configuration

### Environment Variables

Set these in your Cloud Function environment:
```bash
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_ADMIN_USER_ID=your_user_id
```

### Cloud Storage Buckets

The bot uses these buckets (create them if they don't exist):
- `your-pdfs-bucket-private` - For PDF files
- `your-thumbnails-bucket-public` - For thumbnail images

## 📝 Workflow

1. **Send PDF**: User sends a PDF file to the bot
2. **Collect Metadata**: Bot asks for title, author, and description
3. **Upload Files**: PDF uploaded to private bucket, thumbnail to public bucket
4. **Generate URL**: Signed URL created for PDF access
5. **Save to Database**: All data saved to Firestore
6. **Publish**: Content automatically appears on the website

## 🐛 Troubleshooting

### PDF Upload Issues

1. **Check Cloud Storage permissions**
2. **Verify bucket names match configuration**
3. **Check Cloud Function logs for detailed errors**

### Bot Not Responding

1. **Verify webhook is set up**: Run `./setup-webhook.sh`
2. **Check bot token is correct**
3. **Ensure user is authorized**: Use `/userid` to verify

### User ID Issues

1. **Current ID may be wrong**: Use `/userid` command
2. **Update AUTHORIZED_USERS**: Replace with correct ID
3. **Redeploy after changes**

## 🔍 Debug Tools

### Test Cloud Storage Connection
```bash
npm run test
```

### Get User ID Locally
```bash
npm run get-userid
```

### Check Function Logs
```bash
gcloud functions logs read telegram-showcase-bot --region=us-central1
```

## 📊 Integration

### Contact Form Notifications

The bot automatically receives notifications when:
- New applications are submitted via the website
- Form data includes student details and contact info
- The Teacher receives instant Telegram alerts

### Content Management

- **PDF Storage**: Private bucket with signed URLs
- **Thumbnail Storage**: Public bucket for fast loading
- **Database**: Firestore for metadata and content
- **Website Integration**: Automatic publishing to showcase

## 🛠️ Development

### Local Testing

```bash
# Install dependencies
npm install

# Test locally (requires local Firebase setup)
npm start

# Run tests
npm test
```

### File Structure

```
functions/telegram-bot/
├── index.js              # Main bot logic
├── deploy.sh            # Deployment script
├── setup-webhook.sh     # Webhook configuration
├── get-user-id.js       # User ID helper
├── test-pdf.js          # Debug tests
├── package.json         # Dependencies
└── README.md           # This file
```

## 📞 Support

If you encounter issues:
1. Check Cloud Function logs
2. Verify bot token and user permissions
3. Test with simple commands first
4. Use debug tools to isolate problems

The bot includes comprehensive logging to help identify and resolve issues quickly.