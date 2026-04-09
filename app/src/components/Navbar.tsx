import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTimePalette } from '../context/TimeContext';
import config from '../lib/config';

const THEME_QUIRKS = config.navbar.themeQuirks;

const navLinks = config.navbar.links;

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDark, setIsDark] = useState(true);
    const [themeQuirk, setThemeQuirk] = useState<string | null>(null);
    const themeToggleCount = useRef(0);
    const location = useLocation();
    const palette = useTimePalette();

    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location]);

    const toggleTheme = () => {
        setIsDark(!isDark);
        document.documentElement.classList.toggle('dark');
        themeToggleCount.current++;
        if (themeToggleCount.current >= 3) {
            const idx = (themeToggleCount.current - 3) % THEME_QUIRKS.length;
            setThemeQuirk(THEME_QUIRKS[idx]);
            setTimeout(() => setThemeQuirk(null), 2500);
        }
    };

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.4, 0.25, 1] }}
                className="fixed top-0 left-0 right-0 z-[100]"
            >
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <NavLink to="/" className="relative">
                            <motion.span
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="text-base font-bold tracking-tight text-white/70 hover:text-white/90 transition-colors duration-300"
                                style={{ fontFamily: "'Pacifico', cursive" }}
                            >
                                {config.personal.firstName}
                                <span style={{ color: palette.accent }}>.</span>
                            </motion.span>
                        </NavLink>

                        {/* Desktop nav - floating pill */}
                        <motion.div
                            className={`hidden md:flex items-center gap-1 px-1.5 py-1.5 rounded-full transition-all duration-500 ${
                                isScrolled
                                    ? 'bg-white/[0.04] backdrop-blur-2xl border border-white/[0.06] shadow-lg shadow-black/10'
                                    : 'bg-transparent border border-transparent'
                            }`}
                        >
                            {navLinks.map((link) => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    className={({ isActive }: { isActive: boolean }) =>
                                        `relative px-4 py-1.5 text-[13px] font-medium rounded-full transition-all duration-300 ${
                                            isActive
                                                ? 'text-white'
                                                : 'text-white/30 hover:text-white/60'
                                        }`
                                    }
                                >
                                    {({ isActive }: { isActive: boolean }) => (
                                        <>
                                            {link.label}
                                            {isActive && (
                                                <motion.div
                                                    layoutId="nav-pill"
                                                    className="absolute inset-0 rounded-full bg-white/[0.08] border border-white/[0.06]"
                                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                    style={{ zIndex: -1 }}
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </motion.div>

                        {/* Right side */}
                        <div className="flex items-center gap-1 relative">
                            <AnimatePresence>
                                {themeQuirk && (
                                    <motion.span
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute right-12 whitespace-nowrap text-[11px] italic"
                                        style={{ color: palette.accentGlow }}
                                    >
                                        {themeQuirk}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={toggleTheme}
                                className="p-2 rounded-full text-white/20 hover:text-white/50 transition-colors duration-300"
                            >
                                {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setIsMobileOpen(!isMobileOpen)}
                                className="p-2 rounded-full text-white/40 md:hidden"
                            >
                                {isMobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="fixed inset-0 z-[99] bg-black/40 backdrop-blur-xl md:hidden"
                        onClick={() => setIsMobileOpen(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            className="mx-4 mt-20 p-2 rounded-2xl bg-white/[0.05] backdrop-blur-2xl border border-white/[0.08]"
                        >
                            {navLinks.map((link, index) => (
                                <motion.div
                                    key={link.to}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                >
                                    <NavLink
                                        to={link.to}
                                        className={({ isActive }: { isActive: boolean }) =>
                                            `block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                                                isActive
                                                    ? 'text-white bg-white/[0.06]'
                                                    : 'text-white/40 hover:text-white/60'
                                            }`
                                        }
                                    >
                                        {link.label}
                                    </NavLink>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
