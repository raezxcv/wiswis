import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'

type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

const env = import.meta.env

const getEnv = (key: string, fallback: string) => {
  const value = env[key]
  return typeof value === 'string' && value.trim() ? value : fallback
}

export const firebaseConfig: FirebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', 'AIzaSyA1v9wiltIAsc5pnDCA_mZ_ZM09lP7uBT8'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', 'wiswis-block-party.firebaseapp.com'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', 'wiswis-block-party'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', 'wiswis-block-party.firebasestorage.app'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '607895745593'),
  appId: getEnv('VITE_FIREBASE_APP_ID', '1:607895745593:web:92b3b79625f52ea68249e8'),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', 'G-WPV67YQWGR'),
}

const requiredFirebaseValues = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
]

const isRealValue = (value: string | undefined) => {
  const normalized = value?.trim().toLowerCase() ?? ''
  return Boolean(normalized) && !normalized.startsWith('your_') && !normalized.includes('your_project')
}

export const isFirebaseConfigured = requiredFirebaseValues.every(isRealValue)
export const firebaseProjectId = firebaseConfig.projectId
export const firestoreCollection = 'rsvps'

export const firebaseApp: FirebaseApp | null = isFirebaseConfigured ? initializeApp(firebaseConfig) : null
export const db: Firestore | null = firebaseApp ? getFirestore(firebaseApp) : null
