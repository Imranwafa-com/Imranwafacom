import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import config from '../lib/config';

const titles = config.hero.rotatingTitles;

export default function HeroSection() {
    const [currentTitle, setCurrentTitle] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTitle((prev) => (prev + 1) % titles.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const nameChars = config.personal.name.split('');

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Floating Orbs */}
            <div className="orb w-[500px] h-[500px] bg-[#007AFF] top-[-10%] right-[-10%]" style={{ animationDelay: '0s' }} />
            <div className="orb w-[400px] h-[400px] bg-[#c678dd] bottom-[-10%] left-[-10%]" style={{ animationDelay: '5s' }} />
            <div className="orb w-[300px] h-[300px] bg-[#56b6c2] top-[40%] left-[60%]" style={{ animationDelay: '10s' }} />

            {/* Grid pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
                style={{
                    backgroundImage: `linear-gradient(rgba(0,122,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(0,122,255,0.3) 1px, transparent 1px)`,
                    backgroundSize: '60px 60px',
                }}
            />

            <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
                {/* Greeting */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm md:text-base font-medium text-[#007AFF] mb-6 tracking-widest uppercase"
                >
                    {config.hero.greeting}
                </motion.p>

                {/* Name - Stagger Character Reveal */}
                <h1 className="text-5xl sm:text-7xl md:text-8xl font-heading font-bold mb-6 tracking-tight leading-none">
                    {nameChars.map((char, index) => (
                        <motion.span
                            key={index}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                delay: 0.4 + index * 0.05,
                                type: 'spring',
                                stiffness: 200,
                                damping: 20,
                            }}
                            className={char === ' ' ? 'inline-block w-4' : 'inline-block gradient-text'}
                        >
                            {char}
                        </motion.span>
                    ))}
                </h1>

                {/* Rotating subtitle */}
                <div className="h-10 md:h-12 overflow-hidden mb-8">
                    <motion.p
                        key={currentTitle}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                        className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-light"
                    >
                        {titles[currentTitle]}
                    </motion.p>
                </div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link to={config.hero.ctaPrimary.link}>
                        <motion.button
                            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 122, 255, 0.3)' }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3.5 bg-[#007AFF] hover:bg-[#0066DD] text-white rounded-full font-medium text-sm transition-colors shadow-lg shadow-[#007AFF]/20"
                        >
                            {config.hero.ctaPrimary.text}
                        </motion.button>
                    </Link>
                    <Link to={config.hero.ctaSecondary.link}>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-8 py-3.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-medium text-sm hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            {config.hero.ctaSecondary.text}
                        </motion.button>
                    </Link>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-600"
                >
                    <span className="text-xs tracking-widest uppercase">Scroll</span>
                    <ArrowDown className="w-4 h-4" />
                </motion.div>
            </motion.div>
        </section>
    );
}
