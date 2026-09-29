'use client';

import { useState, ChangeEvent } from 'react';
import { useAuth } from '@/app/context/AuthContext';

// Client-side image compression to convert uploads to lightweight Base64 string
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2d context from canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export default function SuggestProductForm({ cafeId }: { cafeId: number }) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    image_url: ''
  });

  // File upload display states
  const [fileName, setFileName] = useState('');
  const [photoUploadedSuccess, setPhotoUploadedSuccess] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="mt-8 text-center py-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
        <h3 className="text-xl font-medium text-white mb-2">Notice a missing item?</h3>
        <p className="text-zinc-500 mb-4">Log in to suggest a new product for this cafe's menu.</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mt-8 text-center py-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
        <div className="w-12 h-12 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">✓</div>
        <h3 className="text-xl font-medium text-white mb-2">Suggestion Submitted!</h3>
        <p className="text-zinc-500">Thank you! Your suggested item will be reviewed by an admin.</p>
        <button 
          onClick={() => { 
            setSuccess(false); 
            setIsOpen(false); 
            setFileName('');
            setPhotoUploadedSuccess(false);
          }} 
          className="mt-4 text-amber-500 hover:underline text-sm font-medium cursor-pointer"
        >
          Suggest another item
        </button>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <div className="mt-8 text-center py-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
        <h3 className="text-xl font-medium text-white mb-2">Notice a missing item?</h3>
        <p className="text-zinc-500 mb-4">Help us keep the menu up to date!</p>
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-amber-500 text-zinc-950 font-medium px-6 py-2 rounded-full hover:bg-amber-400 transition-colors cursor-pointer"
        >
          Suggest a Menu Item
        </button>
      </div>
    );
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      setFileName(file.name);
      setFormData((prev) => ({ ...prev, image_url: compressedBase64 }));
      setPhotoUploadedSuccess(true);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Could not process this image file. Please choose another photo.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch(`/api/cafes/${cafeId}/products/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', price: '', description: '', image_url: '' });
        setFileName('');
        setPhotoUploadedSuccess(false);
      } else {
        alert('Failed to suggest product. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-zinc-900 border border-white/5 rounded-3xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-white">Suggest a Menu Item</h3>
        <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white cursor-pointer">✕</button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Product Name *</label>
          <input 
            required
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
            placeholder="e.g. Spanish Latte"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Price *</label>
          <input 
            required
            type="text" 
            value={formData.price}
            onChange={e => setFormData({...formData, price: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white"
            placeholder="150"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
          <textarea 
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 text-white resize-none h-24"
            placeholder="Describe ingredients or size"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">Item Photo</label>
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex items-center gap-3">
            <label className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-4 py-2.5 rounded-lg cursor-pointer transition-colors shrink-0">
              Choose File
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-xs text-zinc-400 truncate">
              {fileName || 'No file chosen'}
            </span>
          </div>
          {photoUploadedSuccess && (
            <p className="text-xs text-emerald-500 font-semibold mt-1.5">
              Photo uploaded successfully!
            </p>
          )}
        </div>
        
        <button 
          disabled={isSubmitting}
          type="submit" 
          className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 mt-2 cursor-pointer"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Menu Item Suggestion'}
        </button>
      </form>
    </div>
  );
}