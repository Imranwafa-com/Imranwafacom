import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, Github } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import ScrollReveal from '../components/ScrollReveal';
import { trackProjectFilter } from '../lib/analytics';
import config from '../lib/config';

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

    const filtered = activeCategory === 'All'
        ? projects
        : projects.filter((p) => p.category === activeCategory);

    return (
        <PageTransition>
            <div className="min-h-screen pt-24 pb-16">
                <section className="px-6 py-12">
                    <div className="max-w-6xl mx-auto">
                        {/* Header */}
                        <ScrollReveal>
                            <div className="mb-12">
                                <p className="text-sm font-medium text-[#007AFF] tracking-widest uppercase mb-2">
                                    {config.projects.sectionLabel}
                                </p>
                                <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 dark:text-white mb-4">
                                    {config.projects.heading}{' '}
                                    <span className="gradient-text">{config.projects.headingHighlight}</span>
                                </h1>
                                <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
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
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            setActiveCategory(cat);
                                            trackProjectFilter(cat);
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeCategory === cat
                                                ? 'bg-[#007AFF] text-white shadow-lg shadow-[#007AFF]/20'
                                                : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                            }`}
                                    >
                                        {cat}
                                    </motion.button>
                                ))}
                            </div>
                        </ScrollReveal>

                        {/* Grid */}
                        <motion.div layout className="grid md:grid-cols-2 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filtered.map((project) => (
                                    <motion.div
                                        key={project.title}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <motion.div
                                            whileHover={{ y: -6, transition: { duration: 0.2 } }}
                                            onClick={() =>
                                                setExpandedProject(
                                                    expandedProject === project.title ? null : project.title
                                                )
                                            }
                                            className="group cursor-pointer bg-white dark:bg-[#141420] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-[#007AFF]/30 dark:hover:border-[#007AFF]/30 transition-all duration-300"
                                        >
                                            <div
                                                className={`h-36 bg-gradient-to-br ${project.color} relative overflow-hidden`}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#141420] to-transparent opacity-60" />
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    {project.github && (
                                                        <a
                                                            href={project.github}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 dark:bg-white/10 backdrop-blur-sm hover:bg-white/30 transition-colors"
                                                        >
                                                            <Github className="w-4 h-4 text-white" />
                                                        </a>
                                                    )}
                                                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white/20 dark:bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <ArrowUpRight className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-6 -mt-4 relative">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: project.accent }}
                                                    />
                                                    <span className="text-[10px] font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                                                        {project.category}
                                                    </span>
                                                </div>
                                                <h3 className="text-xl font-heading font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#007AFF] transition-colors">
                                                    {project.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                                    {project.description}
                                                </p>

                                                <AnimatePresence>
                                                    {expandedProject === project.title && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            transition={{ duration: 0.3 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
                                                                {project.longDescription}
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <div className="flex flex-wrap gap-2">
                                                    {project.tags.map((tag) => (
                                                        <span
                                                            key={tag}
                                                            className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 font-medium"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
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
