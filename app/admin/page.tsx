'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'cafes' | 'suggestions' | 'audit'>('cafes');
  const [cafes, setCafes] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cafesRes, suggestionsRes] = await Promise.all([
        fetch('/api/cafes'),
        fetch('/api/admin/suggestions')
      ]);

      if (cafesRes.ok) setCafes(await cafesRes.json());
      if (suggestionsRes.ok) setSuggestions(await suggestionsRes.json());
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveSuggestion = async (suggestion: any) => {
    try {
      const res = await fetch('/api/admin/suggestions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestion)
      });

      if (res.ok) {
        alert('Suggestion approved and added to active cafes!');
        fetchData();
      } else {
        alert('Failed to approve suggestion.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 p-6 flex flex-col justify-between">
        <div>
          <Link href="/" className="text-2xl font-bold tracking-tight text-white mb-8 block">
            CafeNav
          </Link>

          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Admin Panel
          </p>

          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('cafes')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'cafes'
                  ? 'bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Manage Cafes
            </button>

            <button
              onClick={() => setActiveTab('suggestions')}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                activeTab === 'suggestions'
                  ? 'bg-amber-500/10 text-amber-500 font-bold border border-amber-500/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <span>Pending Suggestions</span>
              {suggestions.length > 0 && (
                <span className="bg-amber-500 text-zinc-950 text-xs px-2 py-0.5 rounded-full font-bold">
                  {suggestions.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10">
        {activeTab === 'cafes' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Manage Cafes</h1>
            <p className="text-zinc-400 mb-8">Add, edit, or remove cafes and their menus.</p>
            {/* Existing Active Directory UI renders here */}
            <div className="grid grid-cols-3 gap-6">
              {cafes.map((cafe) => (
                <div key={cafe.id} className="bg-zinc-900 border border-white/5 p-4 rounded-2xl">
                  <h3 className="font-bold text-lg">{cafe.name}</h3>
                  <p className="text-sm text-zinc-400">{cafe.location}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div>
            <h1 className="text-3xl font-bold mb-2">Pending Suggestions</h1>
            <p className="text-zinc-400 mb-8">Review user-submitted cafes before publishing.</p>

            {loading ? (
              <p className="text-zinc-500">Loading suggestions...</p>
            ) : suggestions.length === 0 ? (
              <div className="p-8 bg-zinc-900 rounded-2xl border border-white/5 text-center text-zinc-400">
                No pending suggestions at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {suggestions.map((item) => (
                  <div key={item.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-bold">{item.name}</h3>
                      <span className="text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-medium">
                        {item.price_level} • {item.vibe}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">{item.location}</p>
                    {item.description && <p className="text-xs text-zinc-400 italic">{item.description}</p>}
                    
                    <button
                      onClick={() => handleApproveSuggestion(item)}
                      className="w-full mt-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      Approve & Add to Cafes
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}