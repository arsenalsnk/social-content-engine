# social-content-engine

Automated content publishing platform for social media using RSS feeds, Gemini AI, Firestore, and Facebook Graph API.

## Firebase Setup (Admin SDK)

This backend uses **firebase-admin** (server-side), not the Firebase Web SDK.

1. Open [Firebase Console](https://console.firebase.google.com/) → your project
2. **Project Settings** → **Service accounts** → **Generate new private key**
3. Save the JSON file as `serviceAccountKey.json` in the project root
4. Copy `.env.example` to `.env` and set:

```env
FIREBASE_PROJECT_ID=social-content-engine-c5fb5
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

> Web app config (`apiKey`, `appId`, `authDomain`) is for a future frontend dashboard only.

## Development

```bash
pnpm install
pnpm run build
pnpm run dev
```
