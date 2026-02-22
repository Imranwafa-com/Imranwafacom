import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  showAvatar?: boolean;
}

export default function TypingIndicator({ showAvatar = true }: TypingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2"
    >
      {/* Avatar */}
      {showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 shadow-md">
          IW
        </div>
      )}
      
      {!showAvatar && <div className="w-8 flex-shrink-0" />}

      {/* Typing Dots */}
      <div className="bg-[#E9E9EB] dark:bg-[#2C2C2E] rounded-[20px] rounded-bl-[8px] px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: index * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
