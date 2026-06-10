# Arsenal Auto Content System

## Goal

สร้างระบบโพสต์ข่าว Arsenal อัตโนมัติลง Facebook Page

ระบบต้องสามารถ

* ดึงข่าวจาก RSS Feed
* ตรวจสอบข่าวซ้ำ
* สรุปข่าวเป็นภาษาไทยด้วย Gemini
* สร้าง Caption สำหรับ Facebook
* สร้างรูปภาพจาก Template
* โพสต์ลง Facebook Page อัตโนมัติ
* เก็บข้อมูลข่าวและโพสต์ในฐานข้อมูล
* ทำงานแบบ Cron Job ทุก 15 นาที

---

# Tech Stack

## Backend

* Node.js
* TypeScript

## Database

* Firestore

## AI

* Gemini Pro

## Deployment

* VPS Linux หรือ Railway

## Process Manager

* PM2

---

# Project Structure

src/
├── config/
├── services/
│   ├── rss/
│   ├── gemini/
│   ├── facebook/
│   └── image/
├── repositories/
├── cron/
├── jobs/
├── models/
├── utils/
└── app.ts

---

# Database Design

## Collection: articles

{
id: string
source: string
title: string
url: string
content: string
summary: string
imageUrl: string
publishedAt: timestamp
posted: boolean
createdAt: timestamp
}

Purpose:
Store all fetched news articles.

---

## Collection: posts

{
id: string
articleId: string
facebookPostId: string
caption: string
imagePath: string
postedAt: timestamp
}

Purpose:
Store all Facebook posts.

---

## Collection: settings

{
pageId: string
accessToken: string
}

Purpose:
Store Facebook configuration.

---

# RSS Sources

System must support multiple RSS feeds.

Example categories:

* Arsenal official news
* Transfer news
* Football news

Each source should be configurable.

---

# Duplicate Detection

Before processing an article:

1. Check URL exists
2. Check title similarity
3. Skip if already processed

Rules:

* URL must be unique
* Do not post duplicate stories

---

# Gemini Integration

Input:

* Article title
* Article content

Output:

1. Thai summary
2. Facebook caption
3. Suggested hashtags

Prompt Requirements:

* Use Thai language
* Friendly football page tone
* Maximum 120 words
* Include emoji
* End with engagement question

Example:

🔴 Arsenal are closing in on a new signing...

แฟนปืนคิดว่าดีลนี้จะช่วยทีมได้มากแค่ไหน? 👇

---

# Image Generation

Do not use AI image generation.

Use HTML template rendering.

Process:

Article
→ Caption
→ HTML Template
→ Screenshot with Puppeteer
→ PNG

Template must support:

* BREAKING NEWS
* MATCH RESULT
* MATCH PREVIEW
* TRANSFER NEWS

Output size:

1200 x 1200

---

# Facebook Posting

Workflow:

1. Upload image
2. Publish post
3. Save post ID

Store:

facebookPostId

Retry:

3 attempts

Log failures

---

# Cron Schedule

Every 15 minutes:

1. Fetch RSS
2. Save new articles
3. Generate summaries
4. Generate image
5. Publish Facebook post
6. Update article status

---

# Logging

Log:

* RSS fetch result
* Gemini result
* Facebook API result
* Errors

Log levels:

* INFO
* WARN
* ERROR

---

# Admin Dashboard (Future)

Features:

* View articles
* View posts
* Re-post article
* Enable/disable source
* Manual publish

Tech:

* Next.js
* Firebase Auth

---

# Future Features

## Match Day Automation

Before match:

* Match preview
* Predicted lineup

After match:

* Final score
* Match summary
* Man of the Match poll

---

## Transfer Center

Track:

* Rumours
* Here We Go
* Official Announcements

---

## Analytics

Track:

* Total posts
* Total articles
* Posting success rate
* Top engagement posts

---

# MVP Scope

Must build first:

* RSS ingestion
* Firestore storage
* Duplicate prevention
* Gemini summarization
* Facebook posting
* Cron automation

Ignore for now:

* Dashboard
* Analytics
* Match automation
* Multiple pages

Focus on shipping MVP as fast as possible.
