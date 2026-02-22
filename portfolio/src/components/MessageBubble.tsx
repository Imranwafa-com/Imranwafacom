'use client';

import { motion } from 'framer-motion';
import { Linkedin, Github, Mail, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { Message, LinkPreview } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
  showAvatar?: boolean;
  isLastInGroup?: boolean;
  linkPreviews?: LinkPreview[];
}

const iconMap = {
  linkedin: { Icon: Linkedin, bgColor: 'bg-[#0A66C2]' },
  github: { Icon: Github, bgColor: 'bg-[#181717]' },
  mail: { Icon: Mail, bgColor: 'bg-[#EA4335]' },
};

export default function MessageBubble({ 
  message, 
  showAvatar = true,
  isLastInGroup = true,
  linkPreviews = []
}: MessageBubbleProps) {
  const isLink = message.type === 'link' && message.linkData;
  const hasLinkPreviews = linkPreviews.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 350,
        damping: 25,
        duration: 0.4
      }}
      className={`flex items-start gap-2 ${
        message.isUser ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Avatar */}
      {!message.isUser && showAvatar && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md mt-1"
        >
          IW
        </motion.div>
      )}
      
      {!message.isUser && !showAvatar && (
        <div className="w-8 flex-shrink-0" />
      )}

      {/* Message Content */}
      <div className={`flex flex-col ${message.isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* Bubble */}
        <div
          className={`relative px-4 py-2.5 text-[15px] leading-relaxed shadow-sm ${
            message.isUser
              ? 'bg-[#007AFF] text-white rounded-[20px] rounded-br-[8px]'
              : isLink
              ? 'bg-[#E9E9EB] dark:bg-[#2C2C2E] text-black dark:text-white rounded-[20px] rounded-bl-[8px] border border-gray-200 dark:border-gray-700'
              : 'bg-[#E9E9EB] dark:bg-[#2C2C2E] text-black dark:text-white rounded-[20px] rounded-bl-[8px]'
          }`}
        >
          {isLink ? (
            <a
              href={message.linkData!.url}
              target={message.linkData!.icon !== 'mail' ? '_blank' : undefined}
              rel={message.linkData!.icon !== 'mail' ? 'noopener noreferrer' : undefined}
              className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group"
            >
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white dark:bg-gray-800 shadow-sm">
                {message.linkData!.icon === 'linkedin' && <Linkedin className="w-4 h-4 text-[#0A66C2]" />}
                {message.linkData!.icon === 'github' && <Github className="w-4 h-4 text-gray-800 dark:text-white" />}
                {message.linkData!.icon === 'mail' && <Mail className="w-4 h-4 text-[#EA4335]" />}
              </span>
              <span className="font-medium">{message.linkData!.label}</span>
            </a>
          ) : (
            <span className="whitespace-pre-wrap">{message.text}</span>
          )}
        </div>

        {/* Link Preview Cards - Attached to message bubble */}
        {hasLinkPreviews && (
          <div className="flex flex-col gap-2 mt-2 w-full">
            {linkPreviews.map((preview, index) => {
              const { Icon, bgColor } = iconMap[preview.icon];
              const isMail = preview.icon === 'mail';
              
              return (
                <motion.a
                  key={preview.domain}
                  href={preview.url}
                  target={isMail ? undefined : '_blank'}
                  rel={isMail ? undefined : 'noopener noreferrer'}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: index * 0.15,
                    duration: 0.4,
                    type: 'spring',
                    stiffness: 400,
                    damping: 25,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="block w-full bg-white dark:bg-[#2C2C2E] rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  {/* Preview Image / Icon Area */}
                  <div className={`${bgColor} h-14 flex items-center justify-center relative`}>
                    <Icon className="w-7 h-7 text-white" />
                    <div className="absolute top-2 right-2">
                      <ExternalLink className="w-4 h-4 text-white/70" />
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">{preview.title}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1.5">
                      {preview.description}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                      {preview.domain}
                    </p>
                  </div>
                </motion.a>
              );
            })}
          </div>
        )}

        {/* Status indicators */}
        {message.isUser && isLastInGroup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-1 mt-1 px-1"
          >
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              {formatTime(message.timestamp)}
            </span>
            {message.status === 'delivered' && (
              <Check className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            )}
            {message.status === 'read' && (
              <CheckCheck className="w-3 h-3 text-[#007AFF]" />
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
