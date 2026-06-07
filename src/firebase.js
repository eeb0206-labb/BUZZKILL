import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, update, onValue, push, remove, serverTimestamp } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyB6NbTXP0lQip4DUVdt0nEygjH3LILzxnU",
  authDomain: "quiz-night-2c8f7.firebaseapp.com",
  databaseURL: "https://quiz-night-2c8f7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "quiz-night-2c8f7",
  storageBucket: "quiz-night-2c8f7.firebasestorage.app",
  messagingSenderId: "207084392520",
  appId: "1:207084392520:web:2993ddc9fb0c093e4f087d"
}

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

export { db, ref, set, get, update, onValue, push, remove, serverTimestamp }
export default db
