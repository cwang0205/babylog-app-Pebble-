# Post-Deployment Checklist (Local Edition)

This version of BabyLog uses Local Storage for data. You do NOT need to configure a Cloud Database (Firestore).

## 1. Firebase Authentication
If you are deploying to a new domain (e.g., Vercel, Netlify, or Firebase Hosting):
1. Go to **Firebase Console** > **Authentication** > **Settings** > **Authorized Domains**.
2. Click **Add Domain**.
3. Enter your production URL (e.g., `myapp.vercel.app`).
   * *Without this, Google Sign-In will fail with error `auth/unauthorized-domain`.*

## 2. Gemini API Key Security
Your API key is used in the frontend to communicate with Google's AI models.

1. Go to **Google AI Studio** or **Google Cloud Console** > **Credentials**.
2. Select your API Key.
3. Under **Application restrictions**, select **Websites**.
4. Add your production URL (e.g., `https://myapp.vercel.app`).

## 3. Environment Variables
If your build process does not automatically inject `process.env.API_KEY`:
*   Ensure your hosting provider (Vercel/Netlify) has the Environment Variable `VITE_API_KEY` or `REACT_APP_API_KEY` set to your Gemini API Key.
