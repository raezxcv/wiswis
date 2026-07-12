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
import { demoRsvps, type CharacterModel, type CharacterStyle, type Rsvp } from '../data/birthdayData'
import { db, firebaseConfig, firebaseProjectId, firestoreCollection, isFirebaseConfigured } from './firebase'

const sortedByCreated = (items: Rsvp[]) =>
  [...items].sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))

const timestampToIso = (value: unknown) => {
  if (!value) return undefined
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'toDate' in value) {
    return (value as Timestamp).toDate().toISOString()
  }
  return undefined
}

const getCharacterStyle = (value: unknown): CharacterStyle => {
  const str = String(value ?? '').toLowerCase()
  return str.includes('girl') ? 'girl' : 'boy'
}

const validCharacterModels: CharacterModel[] = [
  'minecraft-boy', 'minecraft-girl', 'roblox-bacon-hair', 'roblox-noob',
  'roblox-girl', 'dog', 'ispeed', 'tung', 'buff-steve',
]
const getCharacterModel = (value: unknown): CharacterModel | undefined =>
  validCharacterModels.includes(value as CharacterModel) ? (value as CharacterModel) : undefined

const toRsvp = (document: QueryDocumentSnapshot<DocumentData>): Rsvp => {
  const data = document.data()
  const dbStyle = String(data.characterStyle ?? '')

  let characterModel = getCharacterModel(data.characterModel)
  if (!characterModel && validCharacterModels.includes(dbStyle as CharacterModel)) {
    characterModel = dbStyle as CharacterModel
  }

  return {
    id: document.id,
    name: String(data.name ?? '').toUpperCase(),
    characterColor: String(data.characterColor ?? 'green'),
    avatar: String(data.avatar ?? data.characterColor ?? 'green'),
    characterStyle: getCharacterStyle(data.characterStyle),
    characterModel,
    message: typeof data.message === 'string' ? data.message : '',
    attending: true,
    createdAt: timestampToIso(data.createdAt),
  }
}

const getFirebaseSaveMessage = (error: unknown) => {
  if (error instanceof FirebaseError) {
    if (error.code === 'permission-denied') {
      return 'RSVP could not save because Firestore rules are blocking public creates. Publish the updated firestore.rules file, then try again.'
    }

    if (error.code === 'not-found') {
      return `Firestore is not ready for project ${firebaseProjectId}. Enable Firestore Database and create the rsvps collection.`
    }

    if (error.code === 'unavailable') {
      return 'Could not reach Firestore right now. Check your internet connection and try again.'
    }

    return `Firebase error (${error.code}): ${error.message}`
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Could not save RSVP. Please try again.'
}

const makeDocumentId = () => {
  if ('crypto' in window && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID().replaceAll('-', '')
  }

  return `rsvp${Date.now()}${Math.random().toString(36).slice(2, 8)}`
}

function stableRandom(seed: string): number {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return (hash % 100) / 100
}

async function addRsvpViaRest(rsvp: Rsvp) {
  const documentId = makeDocumentId()
  const documentPath = `projects/${firebaseProjectId}/databases/(default)/documents/${firestoreCollection}/${documentId}`
  
  const fields: Record<string, any> = {
    name: { stringValue: rsvp.name },
    characterColor: { stringValue: rsvp.characterColor },
    avatar: { stringValue: rsvp.avatar },
    characterStyle: { stringValue: rsvp.characterStyle ?? 'boy' },
    message: { stringValue: rsvp.message ?? '' },
    attending: { booleanValue: true },
  }

  if (rsvp.characterModel) {
    fields.characterModel = { stringValue: rsvp.characterModel }
  }

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
              fields,
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
    throw new Error(`${status}${payload?.error?.message ?? 'Firestore rejected the RSVP save.'}`)
  }

  return documentId
}

export async function addRsvp(data: Omit<Rsvp, 'id' | 'attending' | 'createdAt'>) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase is not configured in this build. Add real VITE_FIREBASE values, restart Vite, and try again.')
  }

  const now = new Date()
  const normalizedName = data.name.trim().toUpperCase().slice(0, 30)

  const rand = stableRandom(normalizedName)
  const defaultModel = getCharacterStyle(data.characterStyle) === 'girl'
    ? (rand >= 0.5 ? 'roblox-girl' : 'minecraft-girl')
    : (rand >= 0.5 ? 'roblox-noob' : 'minecraft-boy')

  const rsvp: Rsvp = {
    name: normalizedName,
    characterColor: data.characterColor,
    avatar: data.avatar,
    characterStyle: getCharacterStyle(data.characterStyle),
    characterModel: data.characterModel || defaultModel,
    message: data.message?.trim() ?? '',
    attending: true,
    createdAt: now.toISOString(),
  }

  try {
    const id = await addRsvpViaRest(rsvp)
    return { ...rsvp, id }
  } catch (error) {
    console.error('Firebase RSVP save failed', error)
    throw new Error(getFirebaseSaveMessage(error), { cause: error })
  }
}

export async function deleteRsvp(id: string) {
  if (!isFirebaseConfigured || !db) {
    return
  }
  try {
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firebaseProjectId}/databases/(default)/documents/${firestoreCollection}/${id}?key=${firebaseConfig.apiKey}`,
      {
        method: 'DELETE',
      },
    )
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: { message?: string; status?: string } } | null
      const status = payload?.error?.status ? `${payload.error.status}: ` : ''
      throw new Error(`${status}${payload?.error?.message ?? 'Firestore rejected the RSVP delete.'}`)
    }
  } catch (error) {
    console.error('Firebase RSVP delete failed', error)
    throw error
  }
}

export async function updateRsvp(id: string, updates: Partial<Omit<Rsvp, 'id' | 'createdAt'>>) {
  if (!isFirebaseConfigured || !db) {
    return
  }

  const documentPath = `projects/${firebaseProjectId}/databases/(default)/documents/${firestoreCollection}/${id}`
  const fields: Record<string, any> = {}
  const updateMaskPaths: string[] = []

  if (updates.characterColor !== undefined) {
    fields.characterColor = { stringValue: updates.characterColor }
    updateMaskPaths.push('characterColor')
  }
  if (updates.avatar !== undefined) {
    fields.avatar = { stringValue: updates.avatar }
    updateMaskPaths.push('avatar')
  }
  if (updates.characterStyle !== undefined) {
    fields.characterStyle = { stringValue: updates.characterStyle }
    updateMaskPaths.push('characterStyle')
  }
  if (updates.characterModel !== undefined) {
    fields.characterModel = { stringValue: updates.characterModel }
    updateMaskPaths.push('characterModel')
  }

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
              fields,
            },
            updateMask: {
              fieldPaths: updateMaskPaths,
            },
          },
        ],
      }),
    },
  )

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: { message?: string; status?: string } } | null
    const status = payload?.error?.status ? `${payload.error.status}: ` : ''
    throw new Error(`${status}${payload?.error?.message ?? 'Firestore rejected the RSVP update.'}`)
  }
}

export function listenToRsvps(callback: (rsvps: Rsvp[]) => void) {
  if (!isFirebaseConfigured || !db) {
    callback(sortedByCreated(demoRsvps))
    return () => undefined
  }

  const rsvpsQuery = query(collection(db, firestoreCollection), orderBy('createdAt', 'asc'))

  return onSnapshot(
    rsvpsQuery,
    (snapshot) => {
      const rsvps = snapshot.docs.map(toRsvp).filter((item) => item.name && item.attending)
      callback(sortedByCreated(rsvps))
    },
    (error) => {
      console.warn(error)
      callback(sortedByCreated(demoRsvps))
    },
  )
}

export { isFirebaseConfigured }
