import React from 'react';
import ReactDOM from 'react-dom/client';
import SchoolSector from './SchoolSector';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SchoolSector onBack={() => {}} />
  </React.StrictMode>,
);

