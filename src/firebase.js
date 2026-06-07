import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, update, onValue, push, remove, serverTimestamp } from 'firebase/database'

// Firebase client keys are intentionally public — security is via Firebase Rules.
// Env vars take priority (set via Netlify dashboard or .env.local);
// hardcoded fallbacks ensure the app works even if env vars aren't configured.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || 'AIzaSyB6NbTXP0lQip4DUVdt0nEygjH3LILzxnU',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || 'quiz-night-2c8f7.firebaseapp.com',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       || 'https://quiz-night-2c8f7-default-rtdb.europe-west1.firebasedatabase.app',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || 'quiz-night-2c8f7',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || 'quiz-night-2c8f7.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '207084392520',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '1:207084392520:web:2993ddc9fb0c093e4f087d',
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

export { db, ref, set, get, update, onValue, push, remove, serverTimestamp }
export default db
