import React from 'react'
import ReactDOM from 'react-dom/client'
import { ShellProvider } from './state/ShellContext.jsx'
import App from './App.jsx'
import ShareRoutePage from './pages/share/[hash].jsx'
import { resolveRoute } from './routes.ts'
import './index.css'

const route = resolveRoute(window.location.pathname, window.location.hash);

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {route.name === 'share' ? (
            <ShareRoutePage hash={route.hash} />
        ) : (
            <ShellProvider>
                <App />
            </ShellProvider>
        )}
    </React.StrictMode>,
)
