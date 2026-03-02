import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatContainer from '../components/ChatContainer';
import { playOpenSound } from '../lib/sounds';
import config from '../lib/config';

function StatusBar() {
    const [time, setTime] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setTime(
                now.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                })
            );
        };
        updateTime();
        const interval = setInterval(updateTime, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center justify-between px-6 py-1.5 text-white text-xs font-medium bg-black/50 backdrop-blur-sm relative z-30">
            <span className="w-16">{time}</span>
            <div className="w-16" />
            <div className="flex items-center gap-1.5 w-16 justify-end">
                {/* Signal */}
                <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" className="opacity-90">
                    <rect x="0" y="8" width="3" height="4" rx="0.5" />
                    <rect x="4.5" y="5" width="3" height="7" rx="0.5" />
                    <rect x="9" y="2" width="3" height="10" rx="0.5" />
                    <rect x="13.5" y="0" width="2.5" height="12" rx="0.5" opacity="0.3" />
                </svg>
                {/* WiFi */}
                <svg width="14" height="12" viewBox="0 0 14 12" fill="currentColor" className="opacity-90">
                    <path d="M7 10.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
                    <path d="M3.5 8.5C4.6 7.4 5.8 6.8 7 6.8s2.4.6 3.5 1.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M1 5.5C2.8 3.7 4.8 2.8 7 2.8s4.2.9 6 2.7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                {/* Battery */}
                <div className="flex items-center gap-0.5">
                    <div className="w-6 h-3 rounded-[2px] border border-white/60 flex items-center p-[1.5px]">
                        <div className="w-3/4 h-full bg-[#34C759] rounded-[1px]" />
                    </div>
                    <div className="w-[2px] h-1.5 bg-white/40 rounded-r-sm" />
                </div>
            </div>
        </div>
    );
}

export default function ContactPage() {
    const [isLaunched, setIsLaunched] = useState(false);
    const [showContent, setShowContent] = useState(false);

    useEffect(() => {
        const timer1 = setTimeout(() => {
            setIsLaunched(true);
            playOpenSound();
        }, 400);

        const timer2 = setTimeout(() => {
            setShowContent(true);
        }, 900);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div className="h-screen bg-[#0a0a0f] relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0d0d1a] to-[#0a0a0f]" />

            {/* Ambient glow */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 1.2 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[600px] rounded-full bg-[#007AFF]/5 blur-[120px] pointer-events-none"
            />

            <AnimatePresence mode="wait">
                {!isLaunched ? (
                    <motion.div
                        key="app-icon"
                        className="absolute inset-0 flex items-center justify-center"
                        exit={{ opacity: 0, scale: 3 }}
                        transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="w-20 h-20 bg-gradient-to-b from-[#5AC8FA] to-[#34C759] rounded-[22px] flex items-center justify-center shadow-2xl shadow-green-500/20"
                        >
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
                                <path
                                    d="M12 2C6.477 2 2 5.813 2 10.5c0 2.34 1.065 4.453 2.787 5.995-.12 1.165-.57 2.7-1.537 3.755a.25.25 0 0 0 .196.406c1.754-.07 3.358-.685 4.624-1.463A11.49 11.49 0 0 0 12 19c5.523 0 10-3.813 10-8.5S17.523 2 12 2z"
                                    fill="white"
                                />
                            </svg>
                        </motion.div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="phone"
                        initial={{ y: '100vh', scale: 0.85 }}
                        animate={{ y: 0, scale: 1 }}
                        transition={{
                            type: 'spring',
                            stiffness: 180,
                            damping: 28,
                            mass: 1,
                        }}
                        className="relative z-10 h-full flex flex-col items-center pt-16 pb-4 px-4"
                    >
                        {/* Header */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-center mb-3 flex-shrink-0"
                        >
                            <h1 className="text-xl md:text-2xl font-heading font-bold text-white">
                                {config.contact.heading} <span className="gradient-text">{config.contact.headingHighlight}</span>
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {config.contact.subtext}
                            </p>
                        </motion.div>

                        {/* Phone — sized to fit within viewport with proper iPhone ratio */}
                        <div
                            className="phone-frame relative flex-shrink"
                            style={{
                                width: 'min(360px, 80vw)',
                                height: 'calc(100vh - 180px)',
                                maxHeight: '780px',
                            }}
                        >
                            {/* Dynamic Island */}
                            <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-30">
                                <motion.div
                                    initial={{ width: 90 }}
                                    animate={{ width: 120 }}
                                    transition={{ delay: 0.6, duration: 0.4, ease: 'easeOut' }}
                                    className="h-[28px] bg-black rounded-full flex items-center justify-center"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full bg-gray-800 mr-2" />
                                    <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                                </motion.div>
                            </div>

                            {/* Screen */}
                            <div className="phone-frame-inner bg-white dark:bg-black h-full flex flex-col">
                                <StatusBar />
                                <div className="flex-1 min-h-0 overflow-hidden">
                                    {showContent ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                            className="h-full"
                                        >
                                            <ChatContainer />
                                        </motion.div>
                                    ) : (
                                        <div className="h-full flex items-center justify-center bg-black">
                                            <motion.div
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ duration: 1.2, repeat: Infinity }}
                                                className="w-12 h-12 bg-gradient-to-b from-[#5AC8FA] to-[#34C759] rounded-[12px] flex items-center justify-center"
                                            >
                                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 2C6.477 2 2 5.813 2 10.5c0 2.34 1.065 4.453 2.787 5.995-.12 1.165-.57 2.7-1.537 3.755a.25.25 0 0 0 .196.406c1.754-.07 3.358-.685 4.624-1.463A11.49 11.49 0 0 0 12 19c5.523 0 10-3.813 10-8.5S17.523 2 12 2z" fill="white" />
                                                </svg>
                                            </motion.div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Reflection */}
                        <div className="mt-2 h-2 w-[200px] bg-gradient-to-b from-[#007AFF]/5 to-transparent rounded-full blur-sm flex-shrink-0" />

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="text-center mt-1 text-[10px] text-gray-600 flex-shrink-0"
                        >
                            {config.contact.footerText}
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
