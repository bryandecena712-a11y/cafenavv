'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cafeCoordinates, getDistanceInMeters } from '@/app/lib/coordinates';

interface Cafe {
  id: number;
  name: string;
}

interface StoriesBarProps {
  cafes: Cafe[];
}

export default function StoriesBar({ cafes }: StoriesBarProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  
  const [selectedCafeName, setSelectedCafeName] = useState<string>('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [locationMessage, setLocationMessage] = useState('');
  
  const [viewingStory, setViewingStory] = useState<any | null>(null);

  // Mock initial stories
  const [stories, setStories] = useState([
    { id: 1, user: 'Alex', cafe: 'Brew Co.', time: '2m', color: 'bg-emerald-500' },
    { id: 2, user: 'Sarah', cafe: 'Grind. Coffee', time: '1h', color: 'bg-purple-500' },
    { id: 3, user: 'Mike', cafe: '250 Cafe', time: '3h', color: 'bg-blue-500' },
    { id: 4, user: 'Jen', cafe: 'The Elements', time: '5h', color: 'bg-rose-500' },
  ]);

  const openAddModal = () => {
    setIsAddModalOpen(true);
    setLocationStatus('idle');
    setLocationMessage('');
    if (cafes.length > 0) setSelectedCafeName(cafes[0].name);
  };

  const handlePostStory = () => {
    setLocationStatus('checking');
    setLocationMessage('Checking your location...');

    const targetCoords = cafeCoordinates[selectedCafeName];
    if (!targetCoords) {
      setLocationStatus('error');
      setLocationMessage('Cafe location not found in system.');
      return;
    }

    if (isDevMode) {
      // SPOOF LOCATION: pretend user is exactly at the cafe
      setTimeout(() => {
        postSuccess(targetCoords.lat, targetCoords.lng, targetCoords);
      }, 1000);
      return;
    }

    if (!navigator.geolocation) {
      setLocationStatus('error');
      setLocationMessage('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        const distance = getDistanceInMeters(userLat, userLng, targetCoords.lat, targetCoords.lng);

        if (distance <= 100) {
          postSuccess(userLat, userLng, targetCoords);
        } else {
          setLocationStatus('error');
          setLocationMessage(`You are ${Math.round(distance)}m away. You must be within 100m of ${selectedCafeName} to post.`);
        }
      },
      (error) => {
        setLocationStatus('error');
        setLocationMessage('Failed to get your location. Please enable location permissions.');
      },
      { enableHighAccuracy: true }
    );
  };

  const postSuccess = (userLat: number, userLng: number, targetCoords: any) => {
    setLocationStatus('success');
    setLocationMessage('Location verified! Posting your story...');
    
    setTimeout(() => {
      setStories([
        { id: Date.now(), user: 'You', cafe: selectedCafeName, time: 'Just now', color: 'bg-amber-500' },
        ...stories
      ]);
      setIsAddModalOpen(false);
    }, 1500);
  };

  return (
    <>
      {/* Stories Horizontal Bar */}
      <div className="w-full bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900/50 py-4 relative z-30 pt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden py-2">
            
            {/* Add Story Button */}
            <div className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group" onClick={openAddModal}>
              <div className="relative w-16 h-16 rounded-full bg-zinc-900 border-2 border-dashed border-zinc-700 flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-zinc-500 text-2xl group-hover:text-zinc-300 transition-colors">+</span>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-zinc-950">
                  <span className="text-zinc-950 text-[10px] font-bold">+</span>
                </div>
              </div>
              <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300">My Day</span>
            </div>

            {/* Existing Stories */}
            {stories.map(story => (
              <div 
                key={story.id} 
                className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group"
                onClick={() => setViewingStory(story)}
              >
                <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-amber-500 to-rose-500 transition-transform group-hover:scale-105">
                  <div className={`w-full h-full rounded-full border-2 border-zinc-950 ${story.color} flex items-center justify-center`}>
                    <span className="text-xl font-bold text-white/50">{story.user.charAt(0)}</span>
                  </div>
                </div>
                <span className="text-xs font-medium text-zinc-300">{story.user}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Story Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Post to My Day</h3>
            <p className="text-zinc-400 text-sm mb-8">You must be within 100m of the cafe to post.</p>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-zinc-300">Select Cafe</label>
                <select 
                  value={selectedCafeName}
                  onChange={(e) => setSelectedCafeName(e.target.value)}
                  className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none"
                >
                  {cafes.map(cafe => (
                    <option key={cafe.id} value={cafe.name}>{cafe.name}</option>
                  ))}
                </select>
              </div>

              {/* Dev Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div>
                  <div className="text-sm font-semibold text-amber-500">Dev Mode</div>
                  <div className="text-xs text-amber-500/70">Spoof location for testing</div>
                </div>
                <button 
                  onClick={() => setIsDevMode(!isDevMode)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isDevMode ? 'bg-amber-500' : 'bg-zinc-800'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${isDevMode ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
              </div>

              {/* Status Message */}
              {locationStatus !== 'idle' && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                  locationStatus === 'checking' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  locationStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {locationStatus === 'checking' && <span className="inline-block animate-spin mr-2">◒</span>}
                  {locationMessage}
                </div>
              )}

              <button
                onClick={handlePostStory}
                disabled={locationStatus === 'checking' || locationStatus === 'success'}
                className="w-full bg-white text-zinc-950 font-bold py-4 rounded-xl mt-4 hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {locationStatus === 'checking' ? 'Verifying Location...' : 'Post Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Story Modal (Full Screen) */}
      {viewingStory && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 animate-in fade-in duration-300">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 p-4 flex gap-1 z-10">
            <div className="h-1 bg-white/30 rounded-full flex-1 overflow-hidden">
              <div className="h-full bg-white w-full origin-left animate-[progress_3s_linear]" />
            </div>
          </div>
          
          {/* Close Area / Click to close */}
          <div className="absolute inset-0 z-0" onClick={() => setViewingStory(null)} />
          
          <button 
            onClick={() => setViewingStory(null)}
            className="absolute top-8 right-6 z-10 w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
          >
            ✕
          </button>

          {/* Story Content */}
          <div className="relative z-10 w-full max-w-sm aspect-[9/16] bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-end p-8 border border-zinc-800">
            <div className={`absolute inset-0 opacity-20 ${viewingStory.color}`} />
            
            <div className="relative z-10 text-center">
              <div className={`w-24 h-24 mx-auto rounded-full ${viewingStory.color} mb-6 flex items-center justify-center border-4 border-zinc-950 shadow-xl`}>
                <span className="text-5xl text-white/50 font-bold">{viewingStory.user.charAt(0)}</span>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">{viewingStory.user}'s Day</h3>
              <p className="text-zinc-300 mb-2">Chilling at <span className="font-semibold text-amber-500">{viewingStory.cafe}</span></p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{viewingStory.time} ago</p>
            </div>
          </div>

          <style jsx>{`
            @keyframes progress {
              from { transform: scaleX(0); }
              to { transform: scaleX(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
