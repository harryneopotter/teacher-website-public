# ✏️ Teacher-Site: Creative Program Website with Telegram-based CMS

A modern, accessibility-first website designed for a creative education program, powered by **Next.js**, **Google Cloud**, and a **Telegram bot interface** for content management. This site enables fast, frictionless updates from a phone — no CMS, no dashboards, no laptops required.

---

## 🚀 Features

* 📱 **Telegram-first CMS** — Upload showcase content (PDFs, descriptions, images) via Telegram bot
* 📬 **Real-time lead notifications** — Contact form submissions are sent to Telegram with click-to-call formatting
* 🧾 **Auto-processed content** — Files are stored, indexed, and published instantly on the live site
* 🛠️ **Serverless architecture** — Fully managed on GCP with zero-maintenance deployment
* 🧘 **Accessibility-driven UX** — No login or dashboard required for updates; everything happens from the phone

---

## 🧱 Tech Stack

| Layer        | Technology Used                      |
| ------------ | ------------------------------------ |
| Frontend     | Next.js 14 (App Router) + TypeScript |
| Bot Backend  | Telegram Bot API via Cloud Functions |
| Hosting      | Google Cloud Run                     |
| Database     | Firestore (serverless NoSQL)         |
| File Storage | GCP Cloud Storage (PDFs, thumbnails) |
| CI/CD        | Cloud Build                          |

---

## 📘 Project Story

This site was built to solve a real-world problem:
How do you empower someone to run a website **without needing a CMS or a computer**?

The answer: a Telegram-based interface that handles file uploads, descriptions, and instant publishing — all from a phone.
No dashboards, no logins, no friction.

> 📝 [Read the full Project Story →](./PROJECT_STORY.md)

---

## 🧪 Development Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# 3. Run the site locally
npm run dev
```

### Environment Variables

The application requires several environment variables for proper functionality. Copy `.env.example` to `.env.local` and configure the following:

#### Required Variables:
- `GOOGLE_CLOUD_PROJECT` - Your GCP project ID
- `BUCKET_PDFS` - Cloud Storage bucket for PDF files
- `BUCKET_THUMBNAILS` - Cloud Storage bucket for thumbnail images
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather
- `ADMIN_USER_ID` - Telegram user ID of the administrator
- `CONTENT_MANAGER_USER_ID` - Telegram user ID of the content manager
- `FIREBASE_SERVICE_ACCOUNT_KEY` - Firebase service account JSON

#### Optional Variables:
- `ADDITIONAL_IMAGE_DOMAINS` - Comma-separated list of additional image domains
- `NODE_ENV` - Environment (development/production)
- `PORT` - Local development port (defaults to 3000)

See `.env.example` for detailed configuration examples.

---

## 📁 Project Structure

```
/
├── app/               → Next.js App Router pages
├── components/        → Reusable UI blocks
├── lib/               → Cloud services & Firestore logic
├── public/            → Static assets
├── styles/            → CSS modules / global styles
├── functions/telegram-bot/ → Cloud Function for bot logic
├── firestore.rules    → Firestore access control
├── Dockerfile         → Cloud Run container config
└── cloudbuild.yaml    → GCP CI/CD setup
```

---

## 🔒 Security

This repository includes security measures to prevent accidental commits of sensitive data:

* **Pre-commit hooks** - Automatically scan for secrets before committing
* **Gitleaks configuration** - Comprehensive secret detection rules
* **Removal guide** - Step-by-step instructions for cleaning Git history

📖 See [SENSITIVE_DATA_REMOVAL_GUIDE.md](./SENSITIVE_DATA_REMOVAL_GUIDE.md) for detailed security documentation.

### Quick Setup

Install pre-commit hooks to prevent accidental secret commits:

```bash
bash .githooks/install.sh
```

---

## 📜 License

[MIT License](./LICENSE)

---

## 🙋 Want to Reuse This?

This repo is not a generic CMS, but it can serve as a reference for building:

* Phone-first content upload workflows
* Telegram bots as publishing UIs
* Serverless, low-maintenance educational platforms

Feel free to adapt or contribute!
