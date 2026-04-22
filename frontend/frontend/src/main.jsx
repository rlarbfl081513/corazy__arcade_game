import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from '@/components/ThemeProvider'
import ThemeButton from '@/components/buttons/ThemeButton'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      {/* <ThemeButton/> */}
        <App />
    </ThemeProvider>
  </StrictMode>
)