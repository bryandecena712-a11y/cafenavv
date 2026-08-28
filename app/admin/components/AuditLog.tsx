'use client';

import { useEffect, useState } from 'react';

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/audit-logs');
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, []);
  return (
    <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="text-xs uppercase bg-zinc-950/50 text-zinc-500 border-b border-white/5">
            <tr>
              <th scope="col" className="px-6 py-4">Action</th>
              <th scope="col" className="px-6 py-4">Target Resource</th>
              <th scope="col" className="px-6 py-4">Performed By</th>
              <th scope="col" className="px-6 py-4">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Loading logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">No recent activity.</td>
              </tr>
            ) : (
              logs.map((log, index) => (
                <tr 
                  key={log.id} 
                  className={`border-b border-white/5 hover:bg-zinc-800/50 transition-colors ${index % 2 === 0 ? 'bg-zinc-900/30' : 'bg-transparent'}`}
                >
                  <td className="px-6 py-4 font-medium text-white">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      {log.action}
                    </div>
                  </td>
                  <td className="px-6 py-4">{log.target}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-white/5 rounded-md text-xs font-semibold">{log.user?.username || 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4 text-zinc-500">
                    {new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 border-t border-white/5 bg-zinc-950/30 text-xs text-zinc-500 flex justify-between items-center">
        <span>Showing 5 recent actions</span>
        <button className="hover:text-amber-500 transition-colors">View All Logs →</button>
      </div>
    </div>
  );
}
