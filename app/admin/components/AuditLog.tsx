'use client';

const MOCK_LOGS = [
  { id: 1, action: 'Added Cafe', target: 'Brew Co.', user: 'Admin', date: 'Oct 12, 10:45 AM' },
  { id: 2, action: 'Updated Menu', target: 'Latte Art', user: 'Admin', date: 'Oct 12, 09:30 AM' },
  { id: 3, action: 'Deleted Review', target: 'Review #849', user: 'Admin', date: 'Oct 11, 04:20 PM' },
  { id: 4, action: 'Pinned Location', target: 'Daily Grind', user: 'Admin', date: 'Oct 10, 02:15 PM' },
  { id: 5, action: 'Admin Login', target: 'System', user: 'Admin', date: 'Oct 10, 08:00 AM' },
];

export default function AuditLog() {
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
            {MOCK_LOGS.map((log, index) => (
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
                  <span className="px-2 py-1 bg-white/5 rounded-md text-xs font-semibold">{log.user}</span>
                </td>
                <td className="px-6 py-4 text-zinc-500">{log.date}</td>
              </tr>
            ))}
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
