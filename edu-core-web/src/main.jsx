import React from 'react';
import { createRoot } from 'react-dom/client';

import { Providers } from './app/providers';
import { AppRouter } from './app/routes';
import './styles/globals.css';

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Providers>
      <AppRouter />
    </Providers>
  </React.StrictMode>
);
