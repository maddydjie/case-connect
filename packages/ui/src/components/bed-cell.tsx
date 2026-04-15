import * as React from 'react';
import { cn } from '../lib/utils';

type BedStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'reserved' | 'blocked';

interface BedCellProps {
  bedNumber: string;
  status: BedStatus;
  patientName?: string;
  departmentCode?: string;
  onClick?: () => void;
  className?: string;
}

const statusStyles: Record<BedStatus, { bg: string; border: string; text: string }> = {
  available: { bg: 'bg-green-50', border: 'border-green-400', text: 'text-green-700' },
  occupied: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-700' },
  cleaning: { bg: 'bg-amber-50', border: 'border-amber-400', text: 'text-amber-700' },
  maintenance: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-600' },
  reserved: { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-700' },
  blocked: { bg: 'bg-gray-200', border: 'border-gray-500', text: 'text-gray-500' },
};

const statusLabels: Record<BedStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  cleaning: 'Cleaning',
  maintenance: 'Maintenance',
  reserved: 'Reserved',
  blocked: 'Blocked',
};

export function BedCell({ bedNumber, status, patientName, departmentCode, onClick, className }: BedCellProps) {
  const styles = statusStyles[status];

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border-2 p-3 transition-all hover:shadow-md',
        styles.bg,
        styles.border,
        onClick && 'cursor-pointer',
        !onClick && 'cursor-default',
        className,
      )}
    >
      <span className={cn('text-sm font-bold', styles.text)}>{bedNumber}</span>
      <span className={cn('text-xs', styles.text)}>{statusLabels[status]}</span>
      {patientName && <span className="mt-1 truncate text-xs text-gray-600">{patientName}</span>}
      {departmentCode && <span className="text-xs text-gray-400">{departmentCode}</span>}
    </button>
  );
}
