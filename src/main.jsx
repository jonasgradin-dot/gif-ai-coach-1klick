import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import ErrorScreen from './components/ErrorScreen.jsx'
import './index.css'
createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorScreen><App /></ErrorScreen></React.StrictMode>)
