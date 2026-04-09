import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import config from '../lib/config';
import HandwrittenName from '../components/HandwrittenName';
import { useTimePalette } from '../context/TimeContext';
import { ClickCounter, ScrollDirectionText, HoverReveal, LongHover } from '../components/ScrollQuirk';
import { useSectionTracker } from '../hooks/useScrollQuirks';

const titles = config.hero.rotatingTitles;

export default function HeroSection() {
    const [currentTitle, setCurrentTitle] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const tiltRef = useRef({ rotateX: 0, rotateY: 0, targetX: 0, targetY: 0 });
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
    const rafRef = useRef<number>(0);
    const palette = useTimePalette();
    const heroTracker = useSectionTracker('hero');

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTitle((prev) => (prev + 1) % titles.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const animate = useCallback(() => {
        const t = tiltRef.current;
        t.rotateX += (t.targetX - t.rotateX) * 0.08;
        t.rotateY += (t.targetY - t.rotateY) * 0.08;
        setTilt({ rotateX: t.rotateX, rotateY: t.rotateY });
        rafRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(rafRef.current);
    }, [animate]);

    useEffect(() => {
        const handleMouse = (e: MouseEvent) => {
            const el = containerRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const x = (e.clientY - centerY) / rect.height;
            const y = (e.clientX - centerX) / rect.width;
            tiltRef.current.targetX = -x * 8;
            tiltRef.current.targetY = y * 8;
        };

        const handleLeave = () => {
            tiltRef.current.targetX = 0;
            tiltRef.current.targetY = 0;
        };

        window.addEventListener('mousemove', handleMouse);
        window.addEventListener('mouseleave', handleLeave);
        return () => {
            window.removeEventListener('mousemove', handleMouse);
            window.removeEventListener('mouseleave', handleLeave);
        };
    }, []);

    return (
        <section ref={heroTracker.ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Dynamic gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-[20%] -right-[10%] w-[700px] h-[700px] rounded-full bg-gradient-to-br ${palette.orbs[0]} opacity-[0.12] dark:opacity-[0.08] blur-[120px] animate-[float-liquid_20s_ease-in-out_infinite]`} />
                <div className={`absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr ${palette.orbs[1]} opacity-[0.12] dark:opacity-[0.07] blur-[120px] animate-[float-liquid_25s_ease-in-out_infinite_reverse]`} />
                <div className={`absolute top-[30%] left-[50%] -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r ${palette.orbs[2]} opacity-[0.08] dark:opacity-[0.05] blur-[100px] animate-[float-liquid_22s_ease-in-out_infinite_3s]`} />
            </div>

            {/* 3D tilting content */}
            <div
                ref={containerRef}
                className="relative z-10 text-center px-6 max-w-5xl mx-auto"
                style={{ perspective: '1200px' }}
            >
                <div
                    style={{
                        transform: `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg)`,
                        transformStyle: 'preserve-3d',
                        transition: 'transform 0.05s linear',
                    }}
                >
                    {/* Time-based greeting */}
                    <motion.p
                        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ delay: 0.3, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
                        className={`text-xs md:text-sm font-medium ${palette.textMuted} mb-10 tracking-[0.25em] uppercase`}
                    >
                        <HoverReveal hoverText={config.hero.timeTrackHint}>
                            {palette.greeting}
                        </HoverReveal>
                    </motion.p>

                    {/* Name - pen drawing with time-based gradient */}
                    <div className="mb-8" style={{ transform: 'translateZ(60px)' }}>
                        <ClickCounter>
                            <HandwrittenName
                                text={config.personal.name}
                                gradientStops={palette.gradientStops}
                            />
                        </ClickCounter>
                    </div>

                    {/* Rotating subtitle */}
                    <div
                        className="h-10 md:h-12 overflow-hidden mb-12"
                        style={{ transform: 'translateZ(30px)' }}
                    >
                        <motion.p
                            key={currentTitle}
                            initial={{ opacity: 0, y: 25, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -25, filter: 'blur(6px)' }}
                            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
                            className={`text-lg md:text-xl ${palette.textMuted} font-light tracking-wide`}
                        >
                            {titles[currentTitle]}
                        </motion.p>
                    </div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        transition={{ delay: 1.2, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }}
                        className="flex items-center justify-center gap-6"
                        style={{ transform: 'translateZ(20px)' }}
                    >
                        <LongHover>
                            <Link to={config.hero.ctaPrimary.link}>
                                <motion.button
                                    whileHover={{ scale: 1.04, boxShadow: palette.btnShadow }}
                                    whileTap={{ scale: 0.97 }}
                                    className={`px-8 py-3.5 bg-gradient-to-r ${palette.btnGradient} text-white rounded-full font-medium text-sm shadow-lg transition-shadow duration-300`}
                                >
                                    {config.hero.ctaPrimary.text}
                                </motion.button>
                            </Link>
                        </LongHover>
                        <LongHover>
                            <Link to={config.hero.ctaSecondary.link}>
                                <motion.button
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.97 }}
                                    className="px-8 py-3.5 text-white/40 font-medium text-sm hover:text-white/70 transition-colors duration-300 border border-white/10 rounded-full hover:border-white/20"
                                >
                                    {config.hero.ctaSecondary.text}
                                </motion.button>
                            </Link>
                        </LongHover>
                    </motion.div>
                </div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-2 text-white/10"
                >
                    <ArrowDown className="w-3.5 h-3.5" />
                    <ScrollDirectionText
                        downText={config.hero.scrollDown}
                        upText={config.hero.scrollUp}
                        className="text-[10px] tracking-widest uppercase"
                    />
                </motion.div>
            </motion.div>
        </section>
    );
}
