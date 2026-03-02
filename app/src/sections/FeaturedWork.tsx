import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import config from '../lib/config';

const featured = config.featuredWork.projects;

export default function FeaturedWork() {
    return (
        <section className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <ScrollReveal>
                    <div className="flex items-end justify-between mb-12">
                        <div>
                            <p className="text-sm font-medium text-[#007AFF] tracking-widest uppercase mb-2">
                                {config.featuredWork.sectionLabel}
                            </p>
                            <h2 className="text-3xl md:text-4xl font-heading font-bold text-gray-900 dark:text-white">
                                {config.featuredWork.heading}
                            </h2>
                        </div>
                        <Link
                            to="/projects"
                            className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#007AFF] dark:hover:text-[#007AFF] transition-colors"
                        >
                            View all
                            <ArrowUpRight className="w-4 h-4" />
                        </Link>
                    </div>
                </ScrollReveal>

                <div className="grid md:grid-cols-3 gap-6">
                    {featured.map((project, index) => (
                        <ScrollReveal key={project.title} delay={index * 0.15}>
                            <Link to="/projects">
                                <motion.div
                                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                                    className="group relative bg-white dark:bg-[#141420] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-[#007AFF]/30 dark:hover:border-[#007AFF]/30 transition-all duration-300 h-full"
                                >
                                    <div className={`h-32 bg-gradient-to-br ${project.color} relative overflow-hidden`}>
                                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#141420] to-transparent opacity-60" />
                                        <motion.div
                                            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-white/20 dark:bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ArrowUpRight className="w-4 h-4 text-white" />
                                        </motion.div>
                                    </div>

                                    <div className="p-6 -mt-6 relative">
                                        <div
                                            className="w-3 h-3 rounded-full mb-4"
                                            style={{ backgroundColor: project.accent }}
                                        />
                                        <h3 className="text-lg font-heading font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-[#007AFF] transition-colors">
                                            {project.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                            {project.description}
                                        </p>
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
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>

                <div className="mt-8 text-center sm:hidden">
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-1 text-sm font-medium text-[#007AFF]"
                    >
                        View all projects
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
