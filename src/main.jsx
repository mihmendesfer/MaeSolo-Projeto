import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Theme: prefer localStorage, then system preference
const savedTheme = localStorage.getItem('redesolo-theme');
const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const isDark = savedTheme ? savedTheme === 'dark' : systemDark;
document.documentElement.classList.toggle('dark', isDark);

// Listen for system changes only if no manual preference saved
const mq = window.matchMedia('(prefers-color-scheme: dark)');
mq.addEventListener('change', (e) => {
  if (!localStorage.getItem('redesolo-theme')) {
    document.documentElement.classList.toggle('dark', e.matches);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)