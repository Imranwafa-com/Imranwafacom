import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import { useTimePalette } from '../context/TimeContext';
import config from '../lib/config';
import { SnarkyPrefix, CameBackBadge, HoverReveal, LongHover } from '../components/ScrollQuirk';
import { useSectionTracker } from '../hooks/useScrollQuirks';

export default function QuickAbout() {
    const palette = useTimePalette();
    const tracker = useSectionTracker('quick-about');
    return (
        <section ref={tracker.ref} className="py-32 px-6 relative">
            <div className="max-w-5xl mx-auto">
                <CameBackBadge sectionId="quick-about" />
                <SnarkyPrefix sectionId="quick-about" />
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <ScrollReveal direction="left">
                        <div>
                            <h2
                                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white/90 mb-6"
                                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                            >
                                {config.quickAbout.heading}{' '}
                                <HoverReveal hoverText={config.quickAbout.headingHint}>
                                    <span style={{ color: palette.accent }}>{config.quickAbout.headingHighlight}</span>
                                </HoverReveal>
                            </h2>
                            {config.quickAbout.paragraphs.map((paragraph, i) => (
                                <p key={i} className="text-gray-500 dark:text-white/30 leading-relaxed mb-4 text-[15px]">
                                    {i === 0
                                        ? <><HoverReveal hoverText={config.quickAbout.introHoverHint}>I'm a developer and builder</HoverReveal> {paragraph.slice(paragraph.indexOf(' ', 20))}</>
                                        : paragraph}
                                </p>
                            ))}
                            <LongHover thresholdMs={2000}>
                                <Link to="/about">
                                    <motion.span
                                        whileHover={{ x: 4 }}
                                        className="inline-flex items-center gap-2 font-medium text-sm transition-colors duration-300 mt-2"
                                        style={{ color: palette.accent, opacity: 0.7 }}
                                    >
                                        <HoverReveal hoverText={config.quickAbout.moreAboutHint}>{config.quickAbout.moreAboutText}</HoverReveal>
                                        <ArrowRight className="w-4 h-4" />
                                    </motion.span>
                                </Link>
                            </LongHover>
                        </div>
                    </ScrollReveal>

                    <ScrollReveal direction="right" delay={0.2}>
                        <div className="grid grid-cols-2 gap-3">
                            {config.quickAbout.skills.map((item, index) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{
                                        delay: 0.3 + index * 0.08,
                                        duration: 0.5,
                                        ease: [0.25, 0.4, 0.25, 1],
                                    }}
                                    className="p-4 rounded-xl border border-white/[0.05] hover:border-white/[0.1] transition-all duration-500"
                                >
                                    <p className="text-[10px] text-white/20 font-medium tracking-[0.15em] uppercase mb-1.5">
                                        {item.label}
                                    </p>
                                    <p className="text-sm text-white/55 font-medium">
                                        {item.value}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
}
