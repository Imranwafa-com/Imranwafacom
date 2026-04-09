import { useEffect, useState, useCallback, useRef } from 'react';

interface MousePosition {
    x: number;
    y: number;
    normalizedX: number;
    normalizedY: number;
}

export function useMouseGlow() {
    const [mouse, setMouse] = useState<MousePosition>({
        x: 0,
        y: 0,
        normalizedX: 0.5,
        normalizedY: 0.5,
    });

    const rafRef = useRef<number>(0);
    const latestEvent = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

    const update = useCallback(() => {
        const { x, y } = latestEvent.current;
        setMouse({
            x,
            y,
            normalizedX: x / window.innerWidth,
            normalizedY: y / window.innerHeight,
        });
        rafRef.current = 0;
    }, []);

    useEffect(() => {
        const handleMove = (e: MouseEvent) => {
            latestEvent.current = { x: e.clientX, y: e.clientY };
            if (!rafRef.current) {
                rafRef.current = requestAnimationFrame(update);
            }
        };

        window.addEventListener('mousemove', handleMove);
        return () => {
            window.removeEventListener('mousemove', handleMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [update]);

    return mouse;
}

export function useElementMouseGlow(ref: React.RefObject<HTMLElement | null>) {
    const [position, setPosition] = useState({ x: 0.5, y: 0.5, active: false });
    const rafRef = useRef<number>(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleMove = (e: MouseEvent) => {
            if (rafRef.current) return;
            rafRef.current = requestAnimationFrame(() => {
                const rect = el.getBoundingClientRect();
                setPosition({
                    x: (e.clientX - rect.left) / rect.width,
                    y: (e.clientY - rect.top) / rect.height,
                    active: true,
                });
                rafRef.current = 0;
            });
        };

        const handleLeave = () => {
            setPosition((p) => ({ ...p, active: false }));
        };

        el.addEventListener('mousemove', handleMove);
        el.addEventListener('mouseleave', handleLeave);
        return () => {
            el.removeEventListener('mousemove', handleMove);
            el.removeEventListener('mouseleave', handleLeave);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [ref]);

    return position;
}
