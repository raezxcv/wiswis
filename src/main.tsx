import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Suppress Chrome extension errors related to message channels
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason &&
    typeof event.reason.message === 'string' &&
    (event.reason.message.includes('message channel closed before a response') ||
      event.reason.message.includes('A listener indicated an asynchronous response'))
  ) {
    event.preventDefault()
  }
})

window.addEventListener('error', (event) => {
  if (
    event.message &&
    (event.message.includes('message channel closed before a response') ||
      event.message.includes('A listener indicated an asynchronous response'))
  ) {
    event.preventDefault()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

