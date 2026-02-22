'use client';

import { motion } from 'framer-motion';
import { Linkedin, Github, Mail, ExternalLink } from 'lucide-react';

interface LinkPreviewCardProps {
  url: string;
  title: string;
  description: string;
  domain: string;
  icon: 'linkedin' | 'github' | 'mail';
  delay?: number;
}

const iconMap = {
  linkedin: { Icon: Linkedin, bgColor: 'bg-[#0A66C2]', color: 'text-[#0A66C2]' },
  github: { Icon: Github, bgColor: 'bg-[#181717]', color: 'text-[#181717] dark:text-white' },
  mail: { Icon: Mail, bgColor: 'bg-[#EA4335]', color: 'text-[#EA4335]' },
};

export default function LinkPreviewCard({
  url,
  title,
  description,
  domain,
  icon,
  delay = 0,
}: LinkPreviewCardProps) {
  const { Icon, bgColor, color } = iconMap[icon];
  const isMail = icon === 'mail';

  return (
    <motion.a
      href={url}
      target={isMail ? undefined : '_blank'}
      rel={isMail ? undefined : 'noopener noreferrer'}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay,
        duration: 0.4,
        type: 'spring',
        stiffness: 400,
        damping: 25,
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="block w-full max-w-[280px] bg-white dark:bg-[#2C2C2E] rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
    >
      {/* Preview Image / Icon Area */}
      <div className={`${bgColor} h-16 flex items-center justify-center relative`}>
        <Icon className="w-8 h-8 text-white" />
        <div className="absolute top-2 right-2">
          <ExternalLink className="w-4 h-4 text-white/70" />
        </div>
      </div>

      {/* Content Area */}
      <div className="p-3">
        <h3 className={`font-semibold text-sm ${color} mb-1`}>{title}</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
          {description}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
          {domain}
        </p>
      </div>
    </motion.a>
  );
}
