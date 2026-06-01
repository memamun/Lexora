**Welcome to Lexora — Synonym Mastery**

**Prerequisites**

1. Clone the repository
2. Install dependencies: `npm install`
3. Create an `.env.local` file:

```
# Base44 (app backend)
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

# Firebase (Google Authentication)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
```

Run the app: `npm run dev`

**Google Authentication**

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project
2. Enable **Google** as a sign-in provider under **Authentication → Sign-in method**
3. Copy your Firebase config values into `.env.local`
4. Add `http://localhost:5173` to the authorized domains (if running locally)

Users can sign in at `/login` with their Google account.

**Publish your changes**

Open [db.com](http://db.com) and click on Publish.
