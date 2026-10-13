import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.tsx'
import SettingsProvider from './components/SettingsProvider.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </SettingsProvider>
  </StrictMode>,
)

// iOS scrolls the whole page to reveal a focused input and doesn't always scroll it back when
// the keyboard closes, leaving the fixed app frame (and its bottom nav) shifted up. Undo that.
document.addEventListener('focusout', () => {
  setTimeout(() => {
    const el = document.activeElement
    if (!el || el === document.body || !el.matches('input, textarea, select')) window.scrollTo(0, 0)
  }, 50)
})

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}
