import React from 'react';
import { cn } from '../utils/cn';
import { usePlatform } from '../contexts/PlatformContext';

interface LogoProps {
  className?: string;
  variant?: 'dark' | 'light';
}

export default function Logo({ className, variant = 'dark' }: LogoProps) {
  const { settings } = usePlatform();

  if (settings.logoUrl) {
    return (
      <img 
        src={settings.logoUrl} 
        alt={`${settings.platformName} Logo`} 
        className={cn("h-8 w-auto object-contain", className)} 
      />
    );
  }

  // Fallback text logo while we don't have the image
  return (
    <span className={cn(
      "font-bold text-xl tracking-tight flex items-center gap-2",
      variant === 'dark' ? "text-zinc-900" : "text-white",
      className
    )}>
      <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-lg">
        {settings.platformName.charAt(0)}
      </div>
      {settings.platformName}
    </span>
  );
}
