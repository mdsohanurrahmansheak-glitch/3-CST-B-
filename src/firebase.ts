import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

// .env ফাইল থেকে ফায়ারবেস কনফিগারেশন লোড করা হচ্ছে
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// চেক করা হচ্ছে সব কী (Key) ঠিকমতো লোড হয়েছে কিনা
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

// যদি কী ঠিক থাকে, তবেই ফায়ারবেস চালু হবে
if (firebaseEnabled) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
}

export { app, auth, db }

// CR লগইনের জন্য ইমেইল লিস্ট (ডিফল্ট হিসেবে তোমার ইমেইল দেওয়া আছে)
export const CR_WHITELIST: readonly string[] = (
  import.meta.env.VITE_CR_EMAILS ?? 'mdsohanurrahmansheak@gmail.com'
)
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean)

// CR লগইনের ডিফল্ট পাসওয়ার্ড (তোমার দেওয়া নতুন পাসওয়ার্ড)
export const CR_PASSWORD: string = import.meta.env.VITE_CR_PASSWORD ?? '11335577'

// ImgBB-এর API Key
export const IMGBB_API_KEY: string = import.meta.env.VITE_IMGBB_API_KEY ?? ''