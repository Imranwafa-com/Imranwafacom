import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';

interface ScrollRevealProps {
    children: ReactNode;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    duration?: number;
    className?: string;
}

export default function ScrollReveal({
    children,
    delay = 0,
    direction = 'up',
    duration = 0.7,
    className = '',
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, {
        amount: 0.12,
        margin: '0px 0px -60px 0px',
    });

    const directionOffset = {
        up: { y: 30, x: 0 },
        down: { y: -30, x: 0 },
        left: { y: 0, x: -30 },
        right: { y: 0, x: 30 },
    };

    const hidden = {
        opacity: 0,
        y: directionOffset[direction].y,
        x: directionOffset[direction].x,
        filter: 'blur(6px)',
    };

    const visible = {
        opacity: 1,
        y: 0,
        x: 0,
        filter: 'blur(0px)',
    };

    return (
        <motion.div
            ref={ref}
            initial={hidden}
            animate={isInView ? visible : hidden}
            transition={{
                duration,
                delay: isInView ? delay : 0,
                ease: [0.25, 0.4, 0.25, 1],
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
