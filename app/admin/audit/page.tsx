'use client';

import AuditLog from '../components/AuditLog';

export default function AuditPage() {
  return (
    <div className="p-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white tracking-tight">Audit Log</h1>
        <p className="text-zinc-400 mt-2">Track all administrative actions on the platform.</p>
      </div>
      
      <AuditLog />
    </div>
  );
}
