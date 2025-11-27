# ✨ Telegram CMS Website

> *A warm, accessible, and inclusive platform designed to remove barriers to website management.*

![Website Screenshot](./telegram-cms-website.jpg)

Welcome to the **Telegram CMS Website** – a project born from a simple belief: **technology should empower, not complicate**. This site was built to provide a way to share content with the world, without the complexity of traditional content management systems.

## 💜 Why This Exists

This isn't just another website. It's a solution built with **empathy** and **respect** for real-world needs.

When traditional CMS platforms create barriers – requiring computers, complex dashboards, and steep learning curves – this system takes a different approach. Everything is managed through **Telegram**, right from a phone. No logins, no friction, no frustration.

> 📖 *"How do you empower someone to run a website without needing a CMS or a computer?"*  
> The answer: A phone, a Telegram bot, and thoughtful design.

**Read the complete story:** [Project Story →](./PROJECT_STORY.md)

---

## 🌟 Features Built with Care

* 📱 **Phone-First Management** — Upload content (PDFs, descriptions, images) via Telegram – no computer needed
* 🎯 **Zero Friction** — No dashboards, no logins, no complexity – just simple, direct communication
* 📬 **Instant Notifications** — Contact form submissions delivered immediately to Telegram with all details
* ⚡ **Automatic Processing** — Files are stored securely and published to the live site in seconds
* 🛠️ **Serverless & Sustainable** — Built on Google Cloud with minimal maintenance, designed to last
* ♿ **Accessibility-Driven** — Every design decision considers real human needs and limitations
* 💝 **Built with Love** — Created to remove barriers and celebrate creativity

---

## 🧱 Tech Stack – Built to Last

| Purpose      | Technology | Why We Chose It |
| ------------ | ---------- | --------------- |
| Frontend     | Next.js 14 (App Router) + TypeScript | Fast, modern, accessible web experience |
| Bot Interface| Telegram Bot API via Cloud Functions | Universal, familiar, no app required |
| Hosting      | Google Cloud Run | Auto-scales, cost-effective, reliable |
| Database     | Firestore (NoSQL) | Serverless, real-time, easy to maintain |
| File Storage | Cloud Storage | Secure PDFs, fast thumbnails, built-in CDN |
| Deployment   | Cloud Build | Automated, tested, worry-free updates |

**Philosophy:** Every tool was chosen to minimize maintenance burden and maximize reliability. This system is designed to serve quietly for years with minimal intervention.

---

## 💫 The Mission: Dignity Through Design

This project represents a fundamental belief: **technology should serve people, not the other way around**.

For a user with limited mobility, traditional website management would create unnecessary barriers. Instead of forcing someone to adapt to complex tools, we built tools that adapt to them. The result is a system that respects autonomy, reduces friction, and maintains dignity.

### What This Means in Practice:

- **No Computer Required** — Everything works from a phone through Telegram
- **No Training Needed** — If you can send a message, you can update the website
- **No Barriers** — Designed with accessibility and real-world constraints in mind
- **No Judgment** — The system is forgiving, clear, and supportive

This approach doesn't just solve a technical problem – it honors the person using the system.

> 💭 *"This wasn't built to scale. It was built to serve. And it might be useful to others in similar situations — where accessibility, simplicity, and dignity matter more than features."*  
> — From the [Project Story](./PROJECT_STORY.md)

---

## 🏗️ How It Works – Technology That Cares

The technical architecture is designed with **simplicity and reliability** at its core. Here's how the magic happens:

### The Flow:
```
📱 User sends message via Telegram
    ↓
☁️ Cloud Function receives and processes it
    ↓
🗄️ Content stored in Firestore + Cloud Storage
    ↓
🚀 Website automatically updates on Cloud Run
    ↓
🌐 Users can view the work!
```

### 📸 The Telegram Bot in Action

The bot provides a simple, conversational interface for managing content:

![Telegram Bot Commands](./assets/tg-bot2.png)
*Complete command list and PDF upload workflow*

![Telegram Bot Thumbnail Upload](./assets/tg-bot1.png)
*Thumbnail processing and confirmation messages*

### Why This Stack?

Each technology choice was made with **sustainability and accessibility** in mind:

1. **Telegram Bot** — Familiar, accessible, works on any phone
2. **Cloud Functions** — Only runs when needed, keeping costs minimal
3. **Firestore** — Reliable storage that handles everything automatically
4. **Cloud Run** — Scales from zero, stays free under light usage
5. **Cloud Build** — Automated deployments mean less maintenance

The system is designed to be **set-and-forget** – it just works, quietly and reliably, day after day.

**Want the technical deep-dive?** Check out our comprehensive [Architecture Documentation →](./ARCHITECTURE.md)

---

## 🛠️ Development Setup – Getting Started

Whether you're exploring, contributing, or adapting this for your own needs, we've tried to make setup as smooth as possible.

### Quick Start:

```bash
# 1. Install dependencies
npm install

# 2. Set up your environment
cp .env.example .env.local
# Edit .env.local with your configuration

# 3. Run the development server
npm run dev
```

Visit `http://localhost:3000` to see your local site!

### Configuration Guide

The system needs a few environment variables to work properly. Don't worry – they're all documented!

#### Essential Settings:
- `GOOGLE_CLOUD_PROJECT` — Your Google Cloud project ID
- `BUCKET_PDFS` — Where to store PDF files (Cloud Storage bucket name)
- `BUCKET_THUMBNAILS` — Where to store thumbnail images (Cloud Storage bucket name)
- `TELEGRAM_BOT_TOKEN` — Get this from Telegram's @BotFather
- `ADMIN_USER_ID` — Telegram user ID for the administrator
- `CONTENT_MANAGER_USER_ID` — Telegram user ID for content management
- `FIREBASE_SERVICE_ACCOUNT_KEY` — Firebase credentials (JSON format)

#### Optional Settings:
- `ADDITIONAL_IMAGE_DOMAINS` — Extra domains for images (comma-separated)
- `NODE_ENV` — Development or production mode
- `PORT` — Local server port (defaults to 3000)

**Need help?** Check `.env.example` for detailed examples and guidance!

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

## 🔒 Security & Privacy

**Privacy matters.** This project takes security seriously and includes multiple safeguards:

### Built-In Protection:
- 🔐 **Pre-commit hooks** — Automatically scan for secrets before they're committed
- 🛡️ **Gitleaks integration** — Comprehensive secret detection
- 📋 **Removal guides** — Step-by-step instructions for cleaning sensitive data
- 🔑 **Secret Manager** — All sensitive credentials stored securely in GCP
- 🚫 **Private PDFs** — Content accessible only via time-limited signed URLs
- ✅ **PII Removed** — All personal information scrubbed from repository history

### Set Up Security Hooks:

```bash
# Install pre-commit hooks (recommended)
bash .githooks/install.sh

# Verify everything is clean
npm run security:scan
```

**Learn more:** [Sensitive Data Removal Guide](./SENSITIVE_DATA_REMOVAL_GUIDE.md) | [PII Removal Report](./PII_REMOVAL_REPORT.md)

---

## 📜 License

This project is released under the **MIT License** – free to use, modify, and share.

We believe good ideas should be accessible to everyone. Use this however helps you best! 💚

[View License](./LICENSE)

---

## 💝 Want to Build Something Similar?

**You're absolutely welcome to!** This repository is open-source because we believe good ideas should be shared.

While this isn't a generic CMS solution, it demonstrates powerful patterns you might find useful:

### Great For:
- 📱 **Phone-first content management** — When a computer isn't accessible or practical
- 🎓 **Educational platforms** — Showcasing work, portfolios, and achievements
- ♿ **Accessibility-focused projects** — When traditional tools create barriers
- 🤝 **Community-driven sites** — Simple content updates without technical expertise
- 📝 **Portfolio websites** — For artists, content creators, or creative professionals
- 🌍 **Low-resource environments** — Minimal maintenance, maximum impact

### Key Patterns You Can Adapt:
- Using Telegram bots as a CMS interface
- Serverless architectures that scale to zero
- Phone-first workflows for content creation
- Automated file processing and publishing
- Real-time notifications via messaging apps
- Accessibility-first design thinking

### How to Adapt This:

1. **Fork it!** Start with this codebase and customize to your needs
2. **Study the patterns** — Read the [Architecture docs](./ARCHITECTURE.md) to understand how it works
3. **Ask questions** — Open an issue if you need help understanding something
4. **Share your version** — If you build something cool, we'd love to hear about it!

---

## 🤝 Contributing

We welcome contributions that align with the project's **accessibility-first** philosophy!

### Ways to Help:
- 🐛 **Report bugs** — Help us improve reliability
- 📖 **Improve documentation** — Make it easier for others to understand
- ♿ **Enhance accessibility** — Suggest or implement a11y improvements
- 🌍 **Add translations** — Help reach more communities
- 💡 **Share ideas** — Open an issue to discuss new features

### Contributing Guidelines:
- Keep changes focused and well-documented
- Maintain the warm, inclusive tone of the project
- Test thoroughly (especially accessibility features)
- Write clear commit messages
- Be kind and respectful in all interactions

**Before major changes:** Please open an issue first to discuss your ideas!

---

## 🌈 Who This Helps

This project demonstrates that **thoughtful technology can remove barriers** and empower people. It might inspire solutions for:

- Content creators with accessibility needs
- Small creative businesses without technical resources
- Community organizations needing simple content management
- Anyone who believes technology should adapt to people, not vice versa

**If this helps you or inspires your own project, that makes us incredibly happy.** 💜

---

## 💬 Final Thoughts

This project started with a simple question: **How can we make technology work for people, rather than expecting people to work for technology?**

The answer wasn't found in adding more features, building complex dashboards, or creating elaborate systems. It was found in **removing barriers**, **respecting limitations**, and **designing with empathy**.

Every person deserves technology that respects their dignity and autonomy.

This website demonstrates that **thoughtful design can quietly change lives**.

---

## 🙏 Acknowledgments

Built with care for content creators who inspire.

Special thanks to:
- The content creators whose creativity and imagination make this all worthwhile
- The users who trust their work to be shared
- Everyone who believes in accessible, inclusive technology
- The open-source community for providing the tools that made this possible

---

## 📬 Connect

- **Issues & Questions:** Open an issue on GitHub
- **Discussions:** Share ideas and experiences
- **Documentation:** [Architecture](./ARCHITECTURE.md) | [Project Story](./PROJECT_STORY.md)

---

<div align="center">

**Built with 💜 for accessibility, dignity, and creativity**

*"Technology should empower, not complicate."*

</div>
