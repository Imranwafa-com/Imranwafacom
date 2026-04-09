import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import config from '../lib/config';
import { getReadStats } from '../hooks/useScrollQuirks';
import { useTimePalette } from '../context/TimeContext';

const iconMap: Record<string, LucideIcon> = { github: Github, linkedin: Linkedin, mail: Mail };

const socialLinks = config.socialLinks.map((link) => ({
    ...link,
    Icon: iconMap[link.icon] || Mail,
}));

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Footer() {
    const [showStats, setShowStats] = useState(false);
    const palette = useTimePalette();
    const stats = getReadStats();

    const getFooterQuirk = () => {
        if (stats.skipped > 0 && stats.total > 0) {
            return `you skipped ${stats.skipped} section${stats.skipped > 1 ? 's' : ''}. just saying.`;
        }
        if (stats.scrollBackCount > 5) {
            return `${stats.scrollBackCount} direction changes. you scroll like you drive.`;
        }
        return null;
    };

    const quirk = getFooterQuirk();

    return (
        <footer className="border-t border-white/[0.04]">
            <div className="max-w-5xl mx-auto px-6 py-10">
                <AnimatePresence>
                    {quirk && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="text-[11px] italic text-center mb-4"
                            style={{ color: hexToRgba(palette.accent, 0.25) }}
                        >
                            {quirk}
                        </motion.p>
                    )}
                </AnimatePresence>
                <div className="flex items-center justify-between">
                    <p
                        className="text-[11px] text-white/15 cursor-default"
                        onMouseEnter={() => setShowStats(true)}
                        onMouseLeave={() => setShowStats(false)}
                    >
                        <AnimatePresence mode="wait">
                            {showStats ? (
                                <motion.span
                                    key="stats"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ color: hexToRgba(palette.accent, 0.3) }}
                                >
                                    {stats.total > 0
                                        ? `${stats.read}/${stats.total} sections read`
                                        : 'no sections tracked yet'}
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="copyright"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    &copy; {new Date().getFullYear()} {config.footer.copyright}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </p>

                    <div className="flex items-center gap-4">
                        {config.footer.links.map((item) => (
                            <Link
                                key={item}
                                to={`/${item.toLowerCase()}`}
                                className="text-[11px] text-white/15 hover:text-white/40 transition-colors duration-300"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-1">
                        {socialLinks.map(({ Icon, url, platform }) => (
                            <motion.a
                                key={platform}
                                href={url}
                                target={platform !== 'Email' ? '_blank' : undefined}
                                rel={platform !== 'Email' ? 'noopener noreferrer' : undefined}
                                whileHover={{ scale: 1.1 }}
                                className="p-2 text-white/15 hover:text-white/40 transition-colors duration-300"
                                aria-label={platform}
                            >
                                <Icon className="w-3.5 h-3.5" />
                            </motion.a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
