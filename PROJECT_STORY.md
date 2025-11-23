# 📖 Project Story – Accessible Website Management via Telegram + GCP

This project was created for a creative educator who needed a simple, phone-first way to manage content without relying on a CMS, admin dashboard, or traditional laptop workflows.

Due to limited mobility, updating PDFs, images, and student work through a conventional CMS would have been difficult. Instead, this site is designed to be maintained entirely via a Telegram bot — allowing the educator to upload showcase content, receive contact leads, and update the site effortlessly using just a phone.

---

## ✅ Motivation

The user never asked for these tools directly — they simply needed a functioning website. Once it was built, it became clear that the content (student work submissions) would need to be updated regularly.

Rather than creating a heavy admin layer or CMS, it was more efficient — and more respectful of the user's workflow — to build a Telegram-based interface that integrates directly with the deployed site.

---

## 🧱 Architecture Overview

- **Frontend:** Next.js 14 (App Router) with responsive layout
- **Bot Interface:** Telegram bot via GCP Cloud Functions
- **Storage:** Cloud Storage for PDFs & thumbnails
- **Database:** Firestore for content metadata
- **Hosting:** Cloud Run (frontend + bot backend)
- **Monitoring:** Telegram alerts for success/failure + contact forms

---

## ✨ Key Features

- **Phone-first content uploads:** Just send a PDF and details via Telegram
- **Auto-processing & publishing:** Files + metadata processed, stored, and rendered
- **Real-time leads:** Contact form submissions are sent to Telegram with clickable details
- **Redundancy-aware:** Notifies both user and admin of issues; gives clear, calm messages

---

## 🧭 Design Philosophy

The site doesn’t aim to be flashy — it aims to quietly remove friction.

The tech stack was chosen for:
- Stability (GCP serverless infra)
- Simplicity (no dashboards to maintain)
- Sustainability (fits in Always Free tier)

This wasn’t built to scale. It was built to serve. And it might be useful to others in similar situations — where accessibility, simplicity, and dignity matter more than features.

---

## Notes

- All core interactions are Telegram-based.
- Frontend is minimalist by design.
- If you're looking to build respectful, low-friction interfaces for real-world constraints, this repo may help.
