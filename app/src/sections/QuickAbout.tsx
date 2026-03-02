import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import config from '../lib/config';

export default function QuickAbout() {
    return (
        <section className="py-24 px-6 bg-gray-50/50 dark:bg-[#0e0e16]">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Text */}
                    <ScrollReveal direction="left">
                        <div>
                            <p className="text-sm font-medium text-[#007AFF] tracking-widest uppercase mb-2">
                                {config.quickAbout.sectionLabel}
                            </p>
                            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white mb-6">
                                {config.quickAbout.heading}{' '}
                                <span className="gradient-text">{config.quickAbout.headingHighlight}</span>
                            </h2>
                            {config.quickAbout.paragraphs.map((paragraph, i) => (
                                <p key={i} className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                                    {paragraph}
                                </p>
                            ))}
                            <Link to="/about">
                                <motion.span
                                    whileHover={{ x: 4 }}
                                    className="inline-flex items-center gap-2 text-[#007AFF] font-medium text-sm hover:underline"
                                >
                                    More about me
                                    <ArrowRight className="w-4 h-4" />
                                </motion.span>
                            </Link>
                        </div>
                    </ScrollReveal>

                    {/* Visual */}
                    <ScrollReveal direction="right" delay={0.2}>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-[#007AFF]/10 to-[#c678dd]/10 dark:from-[#007AFF]/5 dark:to-[#c678dd]/5 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
                                <div className="grid grid-cols-2 gap-4">
                                    {config.quickAbout.skills.map((item, index) => (
                                        <motion.div
                                            key={item.label}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            viewport={{ once: true }}
                                            transition={{ delay: 0.3 + index * 0.1 }}
                                            className="bg-white dark:bg-[#141420] rounded-xl p-4 border border-gray-100 dark:border-gray-800"
                                        >
                                            <p className="text-xs text-[#007AFF] font-medium mb-1">{item.label}</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item.value}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#007AFF]/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-[#c678dd]/10 rounded-full blur-2xl" />
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}
