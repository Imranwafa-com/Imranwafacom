import { createContext, useContext } from 'react';
import { useTimeOfDay, type TimePalette } from '../hooks/useTimeOfDay';

const TimeContext = createContext<TimePalette | null>(null);

export function TimeProvider({ children }: { children: React.ReactNode }) {
    const palette = useTimeOfDay();
    return (
        <TimeContext.Provider value={palette}>
            {children}
        </TimeContext.Provider>
    );
}

export function useTimePalette(): TimePalette {
    const ctx = useContext(TimeContext);
    if (!ctx) throw new Error('useTimePalette must be within TimeProvider');
    return ctx;
}
