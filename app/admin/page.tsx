'use client';

import ManageCafes from './components/ManageCafes';

export default function AdminPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Manage Cafes</h1>
        <p className="text-zinc-400 mt-2">Add, edit, or remove cafes and their menus.</p>
      </div>
      
      <ManageCafes />
    </div>
  );
}
