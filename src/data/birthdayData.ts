export type CharacterColor = {
  id: string
  label: string
  hex: string
  dark: string
  light: string
}

export type CharacterStyle = 'boy' | 'girl'

export type CharacterModel =
  | 'minecraft-boy'
  | 'minecraft-girl'
  | 'roblox-bacon-hair'
  | 'roblox-noob'
  | 'roblox-girl'
  | 'dog'
  | 'ispeed'
  | 'tung'
  | 'buff-steve'

export type Rsvp = {
  id?: string
  name: string
  characterColor: string
  avatar: string
  characterStyle?: CharacterStyle
  /** Optional: override the 3D model shown for this guest (set manually in Firestore) */
  characterModel?: CharacterModel
  message?: string
  attending: true
  createdAt?: string
}

export type Greeting = {
  id?: string
  name: string
  message: string
  createdAt?: string
}

export const avatarChoices: CharacterColor[] = [
  { id: 'green', label: 'Emerald Green', hex: '#2fb344', dark: '#197533', light: '#a7f3b8' },
  { id: 'blue', label: 'Diamond Blue', hex: '#24a7d8', dark: '#126c93', light: '#b9efff' },
  { id: 'gold', label: 'Gold Builder', hex: '#f4b63f', dark: '#9b6411', light: '#ffe39a' },
  { id: 'red', label: 'Cake Red', hex: '#ec5b4e', dark: '#9e2922', light: '#ffc8c2' },
  { id: 'purple', label: 'Portal Purple', hex: '#8d63da', dark: '#56359d', light: '#d8c6ff' },
  { id: 'teal', label: 'Sky Teal', hex: '#20b6a6', dark: '#0d6f65', light: '#b6fff4' },
  { id: 'pink', label: 'Pink Miner', hex: '#f06cb7', dark: '#ad2f78', light: '#ffd0ea' },
  { id: 'black', label: 'Black Knight', hex: '#20242b', dark: '#090b10', light: '#8c93a1' },
]

export const birthdayData = {
  childName: 'Wiswis',
  age: 7,
  birthdayDate: '2026-08-07T00:00:00',
  eventDate: 'August 7, 2026',
  eventTime: 'To be added',
  venue: 'To be added',
  dressCode: 'Green / Blocky / Casual',
  invitationTitle: 'Wiswis Birthday: Level 7',
  invitationSubtitle: "A blocky birthday invitation for Louis' 7th birthday",
  cardMessage:
    'Happy Birthday, Wiswis!\n\nYou are now Level 7. We hope your day is full of games, cake, laughter, gifts, and fun.\n\nThis blocky birthday world was made just for you.\n\nLove,\nYour Family.',
  hidden67Message:
    'World created by Tito Ivan. Crafted for Wiswis.',
}

export const demoRsvps: Rsvp[] = [
  {
    id: 'demo-1',
    name: 'TITO IVAN',
    characterColor: 'red',
    avatar: 'red',
    characterStyle: 'boy',
    message: 'Happy birthday Wiswis!',
    attending: true,
    createdAt: '2026-07-01T08:00:00.000Z',
  },
  {
    id: 'demo-2',
    name: 'CALLY',
    characterColor: 'gold',
    avatar: 'gold',
    characterStyle: 'girl',
    message: 'Ready for cake and blocks!',
    attending: true,
    createdAt: '2026-07-01T08:05:00.000Z',
  },
  {
    id: 'demo-3',
    name: 'RAE',
    characterColor: 'blue',
    avatar: 'blue',
    characterStyle: 'boy',
    message: 'Level 7 unlocked soon!',
    attending: true,
    createdAt: '2026-07-01T08:10:00.000Z',
  },
  {
    id: 'demo-4',
    name: 'CLAI CLAI',
    characterColor: 'pink',
    avatar: 'pink',
    characterStyle: 'girl',
    message: 'See you at the party!',
    attending: true,
    createdAt: '2026-07-01T08:15:00.000Z',
  },
]
export const demoGreetings: Greeting[] = [
  {
    id: 'greeting-1',
    name: 'TITO IVAN',
    message: 'Happy birthday Wiswis! Level 7 is going to be awesome.',
    createdAt: '2026-07-01T09:00:00.000Z',
  },
  {
    id: 'greeting-2',
    name: 'CALLY',
    message: 'Save me a slice of cake!',
    createdAt: '2026-07-01T09:05:00.000Z',
  },
  {
    id: 'greeting-3',
    name: 'RAE',
    message: 'Can not wait for the party quest.',
    createdAt: '2026-07-01T09:10:00.000Z',
  },
]