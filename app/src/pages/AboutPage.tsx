import { motion } from 'framer-motion';
import { Code, Palette, Cpu, Globe, Briefcase, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import config from '../lib/config';

const iconMap: Record<string, LucideIcon> = { Code, Palette, Cpu, Globe, Briefcase, GraduationCap };

const skills = config.about.skills.map((s) => ({
    ...s,
    icon: iconMap[s.icon] || Code,
}));

const timeline = config.about.timeline.map((t) => ({
    ...t,
    Icon: iconMap[t.icon] || Briefcase,
}));

export default function AboutPage() {
    return (
        <PageTransition>
            <div className="min-h-screen pt-24 pb-16">
                {/* Hero */}
                <section className="px-6 py-12">
                    <div className="max-w-4xl mx-auto">
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm font-medium text-[#007AFF] tracking-widest uppercase mb-4"
                        >
                            {config.about.sectionLabel}
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-6"
                        >
                            {config.about.heading} <span className="gradient-text">{config.about.headingHighlight}</span>.
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4 text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl"
                        >
                            {config.about.bio.map((paragraph, i) => (
                                <p key={i} dangerouslySetInnerHTML={{ __html: paragraph }} />
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* Skills Grid */}
                <section className="px-6 py-16 bg-gray-50/50 dark:bg-[#0e0e16]">
                    <div className="max-w-6xl mx-auto">
                        <ScrollReveal>
                            <p className="text-sm font-medium text-[#007AFF] tracking-widest uppercase mb-2">
                                Skills & Tools
                            </p>
                            <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-10">
                                What I Work With
                            </h2>
                        </ScrollReveal>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {skills.map((skill, index) => (
                                <ScrollReveal key={skill.label} delay={index * 0.1}>
                                    <motion.div
                                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                        className="bg-white dark:bg-[#141420] rounded-2xl p-6 border border-gray-200 dark:border-gray-800 hover:border-[#007AFF]/30 dark:hover:border-[#007AFF]/30 transition-all duration-300 h-full"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 flex items-center justify-center mb-4">
                                            <skill.icon className="w-5 h-5 text-[#007AFF]" />
                                        </div>
                                        <h3 className="font-heading font-semibold text-gray-900 dark:text-white mb-3">
                                            {skill.label}
                                        </h3>
                                        <div className="flex flex-wrap gap-1.5">
                                            {skill.items.map((item) => (
                                                <span
                                                    key={item}
                                                    className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </motion.div>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section className="px-6 py-16">
                    <div className="max-w-3xl mx-auto">
                        <ScrollReveal>
                            <p className="text-sm font-medium text-[#007AFF] tracking-widest uppercase mb-2">
                                Experience
                            </p>
                            <h2 className="text-3xl font-heading font-bold text-gray-900 dark:text-white mb-10">
                                My Journey
                            </h2>
                        </ScrollReveal>

                        <div className="relative">
                            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-[#007AFF] via-[#c678dd] to-transparent" />

                            <div className="space-y-8">
                                {timeline.map((item, index) => (
                                    <ScrollReveal key={item.title} delay={index * 0.15}>
                                        <div className="flex gap-5">
                                            <div className="relative flex-shrink-0">
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    whileInView={{ scale: 1 }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: 0.3, type: 'spring' }}
                                                    className="w-10 h-10 rounded-full bg-white dark:bg-[#141420] border-2 border-[#007AFF] flex items-center justify-center"
                                                >
                                                    <item.Icon className="w-4 h-4 text-[#007AFF]" />
                                                </motion.div>
                                            </div>

                                            <div className="pb-8">
                                                <span className="text-xs font-medium text-[#007AFF] tracking-wide uppercase">
                                                    {item.period}
                                                </span>
                                                <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mt-1">
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-500 mb-2">
                                                    {item.subtitle}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                    </ScrollReveal>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </PageTransition>
    );
}
