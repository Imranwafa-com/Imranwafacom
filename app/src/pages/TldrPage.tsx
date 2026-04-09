import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Zap } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { useTimePalette } from '../context/TimeContext';
import config from '../lib/config';

const tldrItems = [
  { label: 'who', value: `${config.personal.name}. developer, builder, data person.` },
  ...config.tldr.items.slice(0, 2),
  {
    label: 'projects',
    value: config.projects.items.slice(0, 4).map((p) => p.title.toLowerCase()).join(', ') + '.',
  },
  ...config.tldr.items.slice(2),
  { label: 'contact', value: config.personal.email },
];

export default function TldrPage() {
  const palette = useTimePalette();

  return (
    <PageTransition>
      <div className="min-h-screen pt-24 pb-16 relative flex items-center justify-center">
        <div className="max-w-xl mx-auto px-6 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${palette.accent}15` }}
              >
                <Zap className="w-4 h-4" style={{ color: palette.accent }} />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold text-white/90"
                  style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                >
                  {config.tldr.title}
                </h1>
                <p className="text-[11px] text-white/20 italic">
                  {config.tldr.unlockMessage}
                </p>
              </div>
            </div>

            <p
              className="text-[13px] italic leading-relaxed"
              style={{ color: `${palette.accent}60` }}
            >
              {config.tldr.summaryText}
            </p>
          </motion.div>

          {/* TLDR Items */}
          <div className="space-y-1">
            {tldrItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: 0.15 + i * 0.08,
                  duration: 0.5,
                  ease: [0.25, 0.4, 0.25, 1],
                }}
                className="flex gap-4 py-3 border-b border-white/[0.04]"
              >
                <span
                  className="text-[11px] font-mono uppercase tracking-wider w-16 shrink-0 pt-0.5"
                  style={{ color: `${palette.accent}50` }}
                >
                  {item.label}
                </span>
                <span className="text-[14px] text-white/45 leading-relaxed">
                  {item.value}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-12 flex items-center justify-between"
          >
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[13px] text-white/20 hover:text-white/40 transition-colors duration-300"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {config.tldr.backText}
            </Link>

            <p
              className="text-[11px] italic"
              style={{ color: `${palette.accent}30` }}
            >
              {config.tldr.footerHint}
            </p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
