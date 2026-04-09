import { useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    shimmer?: boolean;
    onClick?: () => void;
}

export default function GlassCard({
    children,
    className = '',
    hover = true,
    shimmer = true,
    onClick,
}: GlassCardProps) {
    const ref = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        ref.current.style.setProperty('--glow-x', `${x}%`);
        ref.current.style.setProperty('--glow-y', `${y}%`);
        ref.current.style.setProperty('--glow-opacity', '1');
    };

    const handleMouseLeave = () => {
        if (!ref.current) return;
        ref.current.style.setProperty('--glow-opacity', '0');
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            whileHover={hover ? { y: -4, transition: { duration: 0.4, ease: [0.25, 0.4, 0.25, 1] } } : undefined}
            className={`glass-panel glass-glow ${shimmer ? 'glass-shimmer' : ''} ${className}`}
        >
            {children}
        </motion.div>
    );
}
