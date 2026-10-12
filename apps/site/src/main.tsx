import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApplicationProviders } from '@sacre-coeur/school-features/app/ApplicationProviders'
import App from './app/App'
import '@sacre-coeur/ui/styles.css'
const roles = ['parent', 'teacher'] as const
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><ApplicationProviders allowedRoles={roles}><App /></ApplicationProviders></React.StrictMode>)
