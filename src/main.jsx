import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './mocks/mockServer.js';  

createRoot(document.getElementById('root')).render(<App />);
