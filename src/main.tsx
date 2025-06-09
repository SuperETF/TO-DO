import "@fortawesome/fontawesome-free/css/all.min.css";
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Router from './app/router';

// ✅ toastify 추가
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <Router />
      <ToastContainer position="top-center" autoClose={2000} />
    </>
  </React.StrictMode>,
);
