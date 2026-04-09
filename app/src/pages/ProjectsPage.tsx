import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Github } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import GlassCard from '../components/GlassCard';
import { trackProjectFilter } from '../lib/analytics';
import config from '../lib/config';
import { HoverReveal, SnarkyPrefix, CameBackBadge } from '../components/ScrollQuirk';
import { useSectionTracker } from '../hooks/useScrollQuirks';

interface Project {
    title: string;
    description: string;
    longDescription: string;
    tags: string[];
    category: string;
    color: string;
    accent: string;
    github?: string;
}

const categories = config.projects.categories;
const projects: Project[] = config.projects.items as Project[];

export default function ProjectsPage() {
    const [activeCategory, setActiveCategory] = useState('All');
    const [expandedProject, setExpandedProject] = useState<string | null>(null);
    const [filterCount, setFilterCount] = useState(0);
    const [filterMessage, setFilterMessage] = useState<string | null>(null);
    const headerTracker = useSectionTracker('projects-header');
    const gridTracker = useSectionTracker('projects-grid');

    const filtered = activeCategory === 'All'
        ? projects
        : projects.filter((p) => p.category === activeCategory);

    const filterMessages: Record<number, string> = Object.fromEntries(
        Object.entries(config.projectsPage.filterMessages).map(([k, v]) => [Number(k), v])
    );

    useEffect(() => {
        if (filterMessages[filterCount]) {
            setFilterMessage(filterMessages[filterCount]);
            const timer = setTimeout(() => setFilterMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [filterCount]);

    return (
        <PageTransition>
            <div className="min-h-screen pt-24 pb-16 relative">
                <div className="caustic-bg" />

                <section className="px-6 py-12 relative z-10">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <CameBackBadge sectionId="projects-header" />
                        <SnarkyPrefix sectionId="projects-header" />
                        <ScrollReveal>
                            <div ref={headerTracker.ref} className="mb-12">
                                <p className="text-xs font-medium text-cyan-500/60 dark:text-cyan-400/40 tracking-[0.2em] uppercase mb-3">
                                    {config.projects.sectionLabel}
                                </p>
                                <h1
                                    className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white/90 mb-4"
                                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                >
                                    {config.projects.heading}{' '}
                                    <HoverReveal hoverText="(and occasionally broken)">
                                        <span className="gradient-text">{config.projects.headingHighlight}</span>
                                    </HoverReveal>
                                </h1>
                                <p className="text-base text-gray-500 dark:text-white/35 max-w-2xl leading-relaxed">
                                    {config.projects.description}
                                </p>
                            </div>
                        </ScrollReveal>

                        {/* Filters */}
                        <ScrollReveal delay={0.1}>
                            <div className="flex flex-wrap gap-2 mb-10">
                                {categories.map((cat) => (
                                    <motion.button
                                        key={cat}
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                            setActiveCategory(cat);
                                            setFilterCount((c) => c + 1);
                                            trackProjectFilter(cat);
                                        }}
                                        className={`px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
                                            activeCategory === cat
                                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/15'
                                                : 'glass-pill text-gray-500 dark:text-white/35 hover:text-gray-800 dark:hover:text-white/60'
                                        }`}
                                    >
                                        {cat}
                                    </motion.button>
                                ))}
                            </div>
                            <AnimatePresence>
                                {filterMessage && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.4 }}
                                        className="text-[12px] italic mt-3 text-white/20"
                                    >
                                        {filterMessage}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </ScrollReveal>

                        {/* Grid */}
                        <motion.div ref={gridTracker.ref} layout className="grid md:grid-cols-2 gap-5">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((project) => (
                                    <motion.div
                                        key={project.title}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
                                        transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                                    >
                                        <GlassCard
                                            className="group cursor-pointer prismatic-border overflow-hidden"
                                            onClick={() =>
                                                setExpandedProject(
                                                    expandedProject === project.title ? null : project.title
                                                )
                                            }
                                        >
                                            <div
                                                className={`h-32 bg-gradient-to-br ${project.color} relative overflow-hidden rounded-t-[1.15rem]`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] to-transparent opacity-70" />
                                                <div className="absolute top-3 right-3 flex gap-2">
                                                    {project.github && (
                                                        <a
                                                            href={project.github}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
                                                        >
                                                            <Github className="w-3.5 h-3.5 text-white" />
                                                        </a>
                                                    )}
                                                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-400">
                                                        <ArrowUpRight className="w-3.5 h-3.5 text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-5 -mt-3 relative z-[2]">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div
                                                        className="w-2.5 h-2.5 rounded-full ring-2 ring-white/10"
                                                        style={{ backgroundColor: project.accent }}
                                                    />
                                                    <span className="text-[10px] font-medium text-gray-400 dark:text-white/25 uppercase tracking-wider">
                                                        {project.category}
                                                    </span>
                                                </div>
                                                <h3
                                                    className="text-lg font-semibold text-gray-900 dark:text-white/85 mb-2 group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors duration-300"
                                                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                                >
                                                    {project.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-white/35 mb-4 leading-relaxed">
                                                    {project.description}
                                                </p>

                                                <AnimatePresence>
                                                    {expandedProject === project.title && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
                                                            className="overflow-hidden"
                                                        >
                                                            <p className="text-sm text-gray-400 dark:text-white/25 mb-4 leading-relaxed border-t border-white/10 dark:border-white/[0.04] pt-4">
                                                                {project.longDescription}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="flex flex-wrap gap-1.5">
                                                    {project.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="glass-pill text-[11px] px-2.5 py-0.5 text-gray-500 dark:text-white/30 font-medium"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                </section>
            </div>
        </PageTransition>
    );
}
