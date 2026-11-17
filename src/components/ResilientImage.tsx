import { useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface ResilientImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
}

export function ResilientImage({ src, alt, className = '', fallbackLabel }: ResilientImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/60 to-slate-200 text-slate-500 border border-slate-200 ${className}`}
        role="img"
        aria-label={alt}
      >
        <FlaskConical className="w-8 h-8 text-blue-700/60 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-600 px-4 text-center truncate max-w-full">
          {fallbackLabel || alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
