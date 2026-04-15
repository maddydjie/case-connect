import { create } from 'zustand';

export interface Bed {
  id: string;
  ward: string;
  number: string;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  patientId?: string;
  patientName?: string;
  admissionDate?: string;
  floor: number;
  type: 'general' | 'icu' | 'nicu' | 'picu' | 'isolation';
}

interface BedState {
  beds: Bed[];
  selectedBed: Bed | null;
  setBeds: (beds: Bed[]) => void;
  updateBed: (bedId: string, updates: Partial<Bed>) => void;
  selectBed: (bed: Bed | null) => void;
}

export const useBedStore = create<BedState>((set) => ({
  beds: [],
  selectedBed: null,

  setBeds: (beds) => set({ beds }),

  updateBed: (bedId, updates) =>
    set((state) => ({
      beds: state.beds.map((bed) =>
        bed.id === bedId ? { ...bed, ...updates } : bed,
      ),
      selectedBed:
        state.selectedBed?.id === bedId
          ? { ...state.selectedBed, ...updates }
          : state.selectedBed,
    })),

  selectBed: (bed) => set({ selectedBed: bed }),
}));
