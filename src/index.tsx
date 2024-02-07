import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { HashRouter } from 'react-router-dom'
import { store, StoreContext } from './store'
import { initPort } from './lib/appPort'
try {
  initPort()
} catch (error) {}

const wakeup = function () {
  setTimeout(function () {
    try {
      chrome.runtime.sendMessage('', function () {})
    } catch (error) {}
    wakeup()
  }, 10000)
}
wakeup()

const container = document.getElementById('root')
if (container) {
  const root = createRoot(container)
  root.render(
    // <React.StrictMode>
    <StoreContext.Provider value={store}>
      <HashRouter>
        <App />
      </HashRouter>
    </StoreContext.Provider>
    // </React.StrictMode>
  )
}
