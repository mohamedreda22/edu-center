import React from 'react';
import { Outlet } from 'react-router-dom';

import AppShell from './layout/AppShell';

const RootLayout = () => {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

export default RootLayout;
