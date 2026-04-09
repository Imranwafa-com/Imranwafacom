import { useState, useEffect } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night' | 'latenight';

export interface TimePalette {
    period: TimeOfDay;
    greeting: string;
    bg: string;
    textPrimary: string;
    textMuted: string;
    accent: string;
    accentGlow: string;
    gradientStops: string[];
    orbs: [string, string, string];
    aurora: {
        blob1: string;
        blob2: string;
        particleHueBase: number;
        particleHueRange: number;
    };
    btnGradient: string;
    btnShadow: string;
}

const validPeriods: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night', 'latenight'];

function getHashOverride(): TimeOfDay | null {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (validPeriods.includes(hash as TimeOfDay)) return hash as TimeOfDay;
    return null;
}

function getTimeOfDay(): TimeOfDay {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    if (hour >= 21 && hour < 24) return 'night';
    return 'latenight';
}

function resolve(): TimeOfDay {
    return getHashOverride() ?? getTimeOfDay();
}

const palettes: Record<TimeOfDay, TimePalette> = {
    morning: {
        period: 'morning',
        greeting: 'Good morning',
        bg: '#0a0810',
        textPrimary: 'text-white/90',
        textMuted: 'text-white/25',
        accent: '#fb923c',
        accentGlow: 'rgba(251, 146, 60, 0.25)',
        gradientStops: ['#fcd34d', '#fb923c', '#f97316', '#ea580c', '#c2410c'],
        orbs: [
            'from-amber-400 via-orange-500 to-rose-500',
            'from-yellow-400 via-orange-400 to-red-400',
            'from-rose-400 via-pink-400 to-orange-400',
        ],
        aurora: {
            blob1: 'rgba(251, 146, 60, 0.08)',
            blob2: 'rgba(244, 63, 94, 0.05)',
            particleHueBase: 25,
            particleHueRange: 30,
        },
        btnGradient: 'from-orange-500 via-amber-500 to-yellow-500',
        btnShadow: '0 0 50px rgba(251, 146, 60, 0.3), 0 0 100px rgba(234, 88, 12, 0.1)',
    },
    afternoon: {
        period: 'afternoon',
        greeting: 'Good afternoon',
        bg: '#050510',
        textPrimary: 'text-white/90',
        textMuted: 'text-white/25',
        accent: '#3b82f6',
        accentGlow: 'rgba(59, 130, 246, 0.3)',
        gradientStops: ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8'],
        orbs: [
            'from-blue-400 via-blue-500 to-indigo-600',
            'from-sky-400 via-blue-500 to-indigo-500',
            'from-cyan-400 via-blue-400 to-sky-500',
        ],
        aurora: {
            blob1: 'rgba(59, 130, 246, 0.08)',
            blob2: 'rgba(56, 189, 248, 0.05)',
            particleHueBase: 210,
            particleHueRange: 40,
        },
        btnGradient: 'from-blue-500 via-blue-600 to-indigo-600',
        btnShadow: '0 0 50px rgba(59, 130, 246, 0.3), 0 0 100px rgba(37, 99, 235, 0.1)',
    },
    evening: {
        period: 'evening',
        greeting: 'Good evening',
        bg: '#0a0614',
        textPrimary: 'text-white/90',
        textMuted: 'text-white/25',
        accent: '#c084fc',
        accentGlow: 'rgba(192, 132, 252, 0.25)',
        gradientStops: ['#f0abfc', '#c084fc', '#a855f7', '#7c3aed', '#6d28d9'],
        orbs: [
            'from-purple-400 via-fuchsia-500 to-pink-500',
            'from-violet-500 via-purple-500 to-indigo-500',
            'from-pink-400 via-rose-400 to-purple-500',
        ],
        aurora: {
            blob1: 'rgba(168, 85, 247, 0.08)',
            blob2: 'rgba(236, 72, 153, 0.05)',
            particleHueBase: 280,
            particleHueRange: 40,
        },
        btnGradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
        btnShadow: '0 0 50px rgba(168, 85, 247, 0.3), 0 0 100px rgba(124, 58, 237, 0.1)',
    },
    night: {
        period: 'night',
        greeting: 'Good night',
        bg: '#030712',
        textPrimary: 'text-white/85',
        textMuted: 'text-white/20',
        accent: '#6366f1',
        accentGlow: 'rgba(99, 102, 241, 0.25)',
        gradientStops: ['#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#3730a3'],
        orbs: [
            'from-indigo-500 via-blue-600 to-slate-700',
            'from-slate-500 via-indigo-600 to-blue-700',
            'from-blue-500 via-indigo-500 to-violet-600',
        ],
        aurora: {
            blob1: 'rgba(99, 102, 241, 0.06)',
            blob2: 'rgba(71, 85, 105, 0.04)',
            particleHueBase: 235,
            particleHueRange: 25,
        },
        btnGradient: 'from-indigo-500 via-indigo-600 to-blue-700',
        btnShadow: '0 0 50px rgba(99, 102, 241, 0.25), 0 0 100px rgba(79, 70, 229, 0.08)',
    },
    latenight: {
        period: 'latenight',
        greeting: 'Still up?',
        bg: '#020a09',
        textPrimary: 'text-white/80',
        textMuted: 'text-white/15',
        accent: '#2dd4bf',
        accentGlow: 'rgba(45, 212, 191, 0.2)',
        gradientStops: ['#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e'],
        orbs: [
            'from-teal-500 via-emerald-600 to-cyan-700',
            'from-emerald-500 via-teal-600 to-green-700',
            'from-cyan-500 via-teal-500 to-emerald-600',
        ],
        aurora: {
            blob1: 'rgba(45, 212, 191, 0.06)',
            blob2: 'rgba(16, 185, 129, 0.04)',
            particleHueBase: 170,
            particleHueRange: 25,
        },
        btnGradient: 'from-teal-500 via-emerald-500 to-cyan-600',
        btnShadow: '0 0 50px rgba(45, 212, 191, 0.25), 0 0 100px rgba(20, 184, 166, 0.08)',
    },
};

export function useTimeOfDay(): TimePalette {
    const [period, setPeriod] = useState<TimeOfDay>(resolve);

    useEffect(() => {
        const onHash = () => setPeriod(resolve());
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    return palettes[period];
}

export function getTimePalette(): TimePalette {
    return palettes[resolve()];
}
