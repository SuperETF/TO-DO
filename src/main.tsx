import "@fortawesome/fontawesome-free/css/all.min.css";
import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Router from './app/router'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>,
)
