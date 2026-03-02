import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail, ArrowUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import config from '../lib/config';

const iconMap: Record<string, LucideIcon> = { github: Github, linkedin: Linkedin, mail: Mail };

const socialLinks = config.socialLinks.map((link) => ({
    ...link,
    Icon: iconMap[link.icon] || Mail,
}));

export default function Footer() {
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0f]">
            <div className="max-w-6xl mx-auto px-6 py-12">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex flex-col items-center md:items-start gap-3">
                        <Link to="/" className="text-xl font-heading font-bold text-gray-900 dark:text-white">
                            {config.personal.logo}<span className="text-[#007AFF]">.</span>
                        </Link>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            {config.footer.tagline}
                        </p>
                    </div>

                    <div className="flex items-center gap-6">
                        {['Home', 'About', 'Projects', 'Contact'].map((item) => (
                            <Link
                                key={item}
                                to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                                className="text-sm text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                {item}
                            </Link>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {socialLinks.map(({ Icon, url, platform }) => (
                            <motion.a
                                key={platform}
                                href={url}
                                target={platform !== 'Email' ? '_blank' : undefined}
                                rel={platform !== 'Email' ? 'noopener noreferrer' : undefined}
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-2.5 rounded-lg text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                                aria-label={platform}
                            >
                                <Icon className="w-4 h-4" />
                            </motion.a>
                        ))}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/50 flex items-center justify-between">
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                        © {new Date().getFullYear()} {config.footer.copyright}
                    </p>
                    <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={scrollToTop}
                        className="p-2 rounded-lg text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        aria-label="Scroll to top"
                    >
                        <ArrowUp className="w-4 h-4" />
                    </motion.button>
                </div>
            </div>
        </footer>
    );
}
