import React from 'react';

import Navbar from './Navbar';
import Sidebar from './Sidebar';

const AppShell = ({ children }) => {
  return (
    <div className="flex h-screen bg-background" dir="rtl">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
