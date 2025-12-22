import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'

// 1. استيراد أدوات Redux (الجديد)
import { Provider } from 'react-redux'  // ده الكومبوننت اللي بيوصل "خراطيم الداتا" لكل التطبيق.
import { store } from './api/app/store' // ده المخزن اللي عملناه.

// Import Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. غلفنا التطبيق كله بالـ Provider واديناه الـ store */}
    <Provider store={store}>

      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ClerkProvider>

    </Provider>
  </StrictMode>
)