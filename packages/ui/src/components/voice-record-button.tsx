import * as React from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { cn } from '../lib/utils';

interface VoiceRecordButtonProps {
  isRecording: boolean;
  isProcessing?: boolean;
  onStart: () => void;
  onStop: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
};

const iconSizeMap = {
  sm: 20,
  md: 24,
  lg: 32,
};

export function VoiceRecordButton({
  isRecording,
  isProcessing,
  onStart,
  onStop,
  size = 'md',
  className,
}: VoiceRecordButtonProps) {
  return (
    <button
      onClick={isRecording ? onStop : onStart}
      disabled={isProcessing}
      className={cn(
        'relative rounded-full transition-all duration-300 focus:outline-none focus:ring-4',
        isRecording
          ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 hover:bg-red-700 focus:ring-red-300'
          : 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 hover:bg-primary-700 focus:ring-primary-300',
        isProcessing && 'cursor-not-allowed opacity-60',
        sizeMap[size],
        className,
      )}
    >
      {isRecording && (
        <span className="absolute inset-0 animate-ping rounded-full bg-red-400 opacity-40" />
      )}
      <span className="relative flex items-center justify-center">
        {isProcessing ? (
          <svg className="animate-spin" width={iconSizeMap[size]} height={iconSizeMap[size]} viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : isRecording ? (
          <Square size={iconSizeMap[size]} fill="currentColor" />
        ) : (
          <Mic size={iconSizeMap[size]} />
        )}
      </span>
    </button>
  );
}
