import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import { useTimePalette } from '../context/TimeContext';
import config from '../lib/config';
import { SnarkyPrefix, CameBackBadge } from '../components/ScrollQuirk';
import { useSectionTracker } from '../hooks/useScrollQuirks';

const featured = config.featuredWork.projects;

export default function FeaturedWork() {
    const palette = useTimePalette();
    const tracker = useSectionTracker('featured-work');
    return (
        <section ref={tracker.ref} className="py-32 px-6 relative">
            <div className="max-w-5xl mx-auto">
                <CameBackBadge sectionId="featured-work" />
                <SnarkyPrefix sectionId="featured-work" />
                <ScrollReveal>
                    <div className="flex items-end justify-between mb-16">
                        <h2
                            className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white/90"
                            style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                        >
                            {config.featuredWork.heading}
                        </h2>
                        <Link
                            to="/projects"
                            className="hidden sm:flex items-center gap-1.5 text-sm text-white/30 hover:text-white/60 transition-colors duration-300"
                        >
                            {config.featuredWork.viewAllText}
                            <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </ScrollReveal>

                <div className="space-y-4">
                    {featured.map((project, index) => (
                        <ScrollReveal key={project.title} delay={index * 0.08}>
                            <Link to="/projects">
                                <div className="group flex items-center justify-between py-6 px-6 rounded-2xl border border-transparent hover:border-white/[0.06] hover:bg-white/[0.02] transition-all duration-500 cursor-pointer">
                                    <div className="flex items-center gap-5">
                                        <div
                                            className="w-2 h-2 rounded-full shrink-0"
                                            style={{ backgroundColor: project.accent }}
                                        />
                                        <div>
                                            <h3
                                                className="text-lg font-semibold text-gray-900 dark:text-white/80 group-hover:text-white transition-colors duration-300"
                                                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                                            >
                                                {project.title}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-white/25 mt-1">
                                                {project.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="hidden md:flex gap-2">
                                            {project.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="text-[11px] px-2.5 py-1 rounded-full text-white/20 border border-white/[0.06] font-medium"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-white/15 group-hover:text-white/50 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                    </div>
                                </div>
                            </Link>
                        </ScrollReveal>
                    ))}
                </div>

                <div className="mt-8 text-center sm:hidden">
                    <Link
                        to="/projects"
                        className="inline-flex items-center gap-1 text-sm font-medium"
                        style={{ color: palette.accent }}
                    >
                        {config.featuredWork.viewAllTextMobile}
                        <ArrowUpRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
