import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import test utilities for development - DISABLED
// Uncomment to enable test utilities
/*
if (process.env.NODE_ENV === 'development') {
  import('./utils/testExports');
}
*/

createRoot(document.getElementById('root')!).render(
  <App />
)
