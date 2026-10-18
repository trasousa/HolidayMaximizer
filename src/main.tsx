import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/app/App';
import { requestPersistentStorage } from '@/lib/storage';
import '@/styles/tailwind.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// Keep the plan in the browser even when the device is low on space.
void requestPersistentStorage();

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
