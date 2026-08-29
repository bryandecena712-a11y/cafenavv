'use client';

import { useState } from 'react';
import { Export } from '@phosphor-icons/react';

export default function ShareButton({ cafeName }: { cafeName: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out ${cafeName} on CafeNav`,
          url: url
        });
      } catch (err) {
        // user cancelled or share failed, fallback to copy
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleShare}
      className="flex items-center justify-center w-12 h-12 bg-zinc-900 rounded-full text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
      title="Share"
    >
      {copied ? (
        <span className="text-xs font-bold text-green-400">Copied!</span>
      ) : (
        <Export size={24} weight="bold" />
      )}
    </button>
  );
}
