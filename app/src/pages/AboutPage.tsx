import { motion } from 'framer-motion';
import { Code, Palette, Cpu, Globe, Briefcase, GraduationCap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import GlassCard from '../components/GlassCard';
import config from '../lib/config';
import { SnarkyPrefix, CameBackBadge, HoverReveal, VisitAwareText } from '../components/ScrollQuirk';
import { useSectionTracker } from '../hooks/useScrollQuirks';

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
    const aboutHeroTracker = useSectionTracker('about-hero');
    const skillsTracker = useSectionTracker('about-skills');
    const timelineTracker = useSectionTracker('about-timeline');

    return (
        <PageTransition>
            <div className="min-h-screen pt-24 pb-16 relative">
                {/* Ambient caustics */}
                <div className="caustic-bg" />

                {/* Hero */}
                <section ref={aboutHeroTracker.ref} className="px-6 py-16 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <motion.p
                            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                            className="text-xs font-medium text-cyan-500/60 dark:text-cyan-400/40 tracking-[0.2em] uppercase mb-4"
                        >
                            {config.about.sectionLabel}
                        </motion.p>
                        <motion.h1
                            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ delay: 0.1, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                            className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white/90 mb-8"
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                            {config.about.heading}{' '}
                            <HoverReveal hoverText={config.aboutPage.nameHint}>
                                <span className="gradient-text">{config.about.headingHighlight}</span>
                            </HoverReveal>.
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
                            className="glass-panel p-8"
                        >
                            <div className="space-y-4 text-base text-gray-500 dark:text-white/40 leading-relaxed max-w-3xl">
                                {config.about.bio.map((paragraph, i) => (
                                    <p key={i} dangerouslySetInnerHTML={{ __html: paragraph }} />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Skills Grid */}
                <section ref={skillsTracker.ref} className="px-6 py-16 relative z-10">
                    <div className="max-w-6xl mx-auto">
                        <CameBackBadge sectionId="about-skills" />
                        <SnarkyPrefix sectionId="about-skills" />
                        <ScrollReveal>
                            <p className="text-xs font-medium text-cyan-500/60 dark:text-cyan-400/40 tracking-[0.2em] uppercase mb-3">
                                <VisitAwareText
                                    sectionId="about-skills-label"
                                    firstVisit={config.aboutPage.skillsSectionLabel}
                                    revisit={config.aboutPage.skillsSectionLabelRevisit}
                                />
                            </p>
                            <h2
                                className="text-3xl font-bold text-gray-900 dark:text-white/90 mb-12"
                                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                            >
                                {config.aboutPage.skillsHeading}
                            </h2>
                        </ScrollReveal>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {skills.map((skill, index) => (
                                <ScrollReveal key={skill.label} delay={index * 0.08}>
                                    <GlassCard className="h-full p-5 prismatic-border relative group/card">
                                        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 dark:bg-cyan-400/10 flex items-center justify-center mb-4 border border-cyan-500/10 dark:border-cyan-400/10">
                                            <skill.icon className="w-4 h-4 text-cyan-500 dark:text-cyan-400/70" />
                                        </div>
                                        <h3
                                            className="font-semibold text-gray-900 dark:text-white/80 mb-3"
                                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                        >
                                            {skill.label}
                                        </h3>
                                        {skill.label === 'Data & AI' && (
                                            <span className="absolute top-3 right-3 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 text-[10px] italic px-2 py-0.5 rounded-full border border-white/[0.06] text-white/20">
                                                type <code className="text-cyan-400/40">data</code>
                                            </span>
                                        )}
                                        <div className="flex flex-wrap gap-1.5">
                                            {skill.items.map((item) => (
                                                <span
                                                    key={item}
                                                    className="glass-pill text-[11px] px-2.5 py-0.5 text-gray-500 dark:text-white/35"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </GlassCard>
                                </ScrollReveal>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section ref={timelineTracker.ref} className="px-6 py-16 relative z-10">
                    <div className="max-w-3xl mx-auto">
                        <CameBackBadge sectionId="about-timeline" />
                        <SnarkyPrefix sectionId="about-timeline" />
                        <ScrollReveal>
                            <p className="text-xs font-medium text-cyan-500/60 dark:text-cyan-400/40 tracking-[0.2em] uppercase mb-3">
                                {config.aboutPage.timelineSectionLabel}
                            </p>
                            <h2
                                className="text-3xl font-bold text-gray-900 dark:text-white/90 mb-12"
                                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                            >
                                <HoverReveal hoverText={config.aboutPage.timelineHeadingHint}>
                                    {config.aboutPage.timelineHeading}
                                </HoverReveal>
                            </h2>
                        </ScrollReveal>

                        <div className="relative">
                            {/* Glass timeline line */}
                            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-400/40 via-violet-400/30 to-transparent" />

                            <div className="space-y-6">
                                {timeline.map((item, index) => (
                                    <ScrollReveal key={item.title} delay={index * 0.12}>
                                        <div className="flex gap-5">
                                            <div className="relative flex-shrink-0">
                                                <motion.div
                                                    initial={{ scale: 0, filter: 'blur(8px)' }}
                                                    whileInView={{ scale: 1, filter: 'blur(0px)' }}
                                                    viewport={{ once: true }}
                                                    transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.4, 0.25, 1] }}
                                                    className="w-10 h-10 rounded-full glass-card flex items-center justify-center border-cyan-500/20 dark:border-cyan-400/15"
                                                    style={{ borderColor: 'rgba(103, 232, 249, 0.2)' }}
                                                >
                                                    <item.Icon className="w-4 h-4 text-cyan-500 dark:text-cyan-400/60" />
                                                </motion.div>
                                            </div>

                                            <div className="pb-6 glass-panel p-5 flex-1 mb-2">
                                                <span className="text-[11px] font-medium text-cyan-500/60 dark:text-cyan-400/40 tracking-wide uppercase">
                                                    {item.period}
                                                </span>
                                                <h3
                                                    className="text-base font-semibold text-gray-900 dark:text-white/80 mt-1"
                                                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                                >
                                                    {item.title}
                                                </h3>
                                                <p className="text-sm text-gray-400 dark:text-white/25 mb-2">
                                                    {item.subtitle}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-white/35 leading-relaxed">
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
