import { FirebaseError } from 'firebase/app'
import {
  Timestamp,
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { demoGreetings, type Greeting } from '../data/birthdayData'
import { db, firebaseConfig, firebaseProjectId, isFirebaseConfigured } from './firebase'

const greetingsCollection = 'greetings'
const localGreetingsKey = 'wiswis-greetings'

const sortedByCreated = (items: Greeting[]) =>
  [...items].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))

const timestampToIso = (value: unknown) => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'toDate' in value) {
    return (value as Timestamp).toDate().toISOString()
  }
  return undefined
}

const makeDocumentId = (prefix: string) => {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return `${prefix}${window.crypto.randomUUID().replaceAll('-', '')}`
  }

  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 8)}`
}

const getLocalGreetings = () => {
  try {
    const stored = window.localStorage.getItem(localGreetingsKey)
    if (!stored) return demoGreetings

    const parsed = JSON.parse(stored) as Greeting[]
    return sortedByCreated(parsed.filter((item) => item.name && item.message))
  } catch {
    return demoGreetings
  }
}

const saveLocalGreetings = (greetings: Greeting[]) => {
  window.localStorage.setItem(localGreetingsKey, JSON.stringify(sortedByCreated(greetings)))
}

const saveGreetingLocally = (greeting: Greeting) => {
  const saved = { ...greeting, id: makeDocumentId('localGreeting') }
  saveLocalGreetings([...getLocalGreetings(), saved])
  window.dispatchEvent(new Event('wiswis:greetings'))
  return saved
}

const toGreeting = (document: QueryDocumentSnapshot<DocumentData>): Greeting => {
  const data = document.data()
  return {
    id: document.id,
    name: String(data.name ?? '').toUpperCase(),
    message: String(data.message ?? ''),
    createdAt: timestampToIso(data.createdAt),
  }
}

const getFirebaseSaveMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return 'Greeting could not save because Firestore rules are blocking public creates. Publish the updated firestore.rules file, then try again.'
    }

    if (error.code === 'not-found') {
      return `Firestore is not ready for project ${firebaseProjectId}. Enable Firestore Database and create the greetings collection.`
    }

    if (error.code === 'unavailable') {
      return 'Could not reach Firestore right now. Check your internet connection and try again.'
    }

    return `Firebase error (${error.code}): ${error.message}`
  }

  if (error instanceof Error) {
    if (error.message.includes('PERMISSION_DENIED')) {
      return 'Greeting could not save because Firestore rules are blocking public creates. Publish the updated firestore.rules file, then try again.'
    }

    return error.message
  }

  return 'Could not send greeting. Please try again.'
}

async function addGreetingViaRest(greeting: Greeting) {
  const documentId = makeDocumentId('greeting')
  const documentPath = `projects/${firebaseProjectId}/databases/(default)/documents/${greetingsCollection}/${documentId}`
  const response = await fetch(
    `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents:commit?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        writes: [
          {
            update: {
              name: documentPath,
              fields: {
                name: { stringValue: greeting.name },
                message: { stringValue: greeting.message },
              },
            },
            updateTransforms: [{ fieldPath: 'createdAt', setToServerValue: 'REQUEST_TIME' }],
          },
        ],
      }),
    },
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string; status?: string } } | null
    const status = payload?.error?.status ? `${payload.error.status}: ` : ''
    throw new Error(`${status}${payload?.error?.message ?? 'Firestore rejected the greeting save.'}`)
  }

  return documentId
}

export async function addGreeting(data: Omit<Greeting, 'id' | 'createdAt'>) {
  const greeting: Greeting = {
    name: data.name.trim().toUpperCase().slice(0, 30),
    message: data.message.trim().slice(0, 140),
    createdAt: new Date().toISOString(),
  }

  if (!greeting.name || !greeting.message) {
    throw new Error('Message is required.')
  }

  if (!isFirebaseConfigured || !db) {
    return saveGreetingLocally(greeting)
  }

  try {
    const id = await addGreetingViaRest(greeting)
    return { ...greeting, id }
  } catch (error) {
    console.error('Firebase greeting save failed', error)
    throw new Error(getFirebaseSaveMessage(error), { cause: error })
  }
}

export function listenToGreetings(callback: (greetings: Greeting[]) => void) {
  if (!isFirebaseConfigured || !db) {
    const notify = () => callback(getLocalGreetings())
    notify()
    window.addEventListener('storage', notify)
    window.addEventListener('wiswis:greetings', notify)

    return () => {
      window.removeEventListener('storage', notify)
      window.removeEventListener('wiswis:greetings', notify)
    }
  }

  const greetingsQuery = query(collection(db, greetingsCollection), orderBy('createdAt', 'asc'))

  return onSnapshot(
    greetingsQuery,
    (snapshot) => {
      const greetings = snapshot.docs.map(toGreeting).filter((item) => item.name && item.message)
      callback(sortedByCreated(greetings))
    },
    (error) => {
      console.warn(error)
      callback(getLocalGreetings())
    },
  )
}
