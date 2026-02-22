'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, Video, Phone } from 'lucide-react';

interface ChatHeaderProps {
  name: string;
  isOnline?: boolean;
}

export default function ChatHeader({ name, isOnline = true }: ChatHeaderProps) {
  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-[#F2F2F7]/90 dark:bg-[#1C1C1E]/90 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800"
    >
      <div className="flex items-center justify-between px-2 py-2">
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center text-[#007AFF] hover:opacity-80 transition-opacity p-2"
        >
          <ChevronLeft className="w-7 h-7" strokeWidth={2.5} />
          <span className="text-[17px]">Back</span>
        </motion.button>

        {/* Contact Info */}
        <div className="flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
              {name.split(' ').map(n => n[0]).join('')}
            </div>
            {isOnline && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[#F2F2F7] dark:border-[#1C1C1E] rounded-full"
              />
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-[15px] font-semibold text-black dark:text-white mt-1"
          >
            {name}
          </motion.h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-[#007AFF] hover:opacity-80 transition-opacity"
          >
            <Video className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-[#007AFF] hover:opacity-80 transition-opacity"
          >
            <Phone className="w-6 h-6" />
          </motion.button>
        </div>
      </div>
    </motion.header>
  );
}
