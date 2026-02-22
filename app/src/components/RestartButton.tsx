import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface RestartButtonProps {
  onRestart: () => void;
}

export default function RestartButton({ onRestart }: RestartButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex justify-center"
    >
      <motion.button
        onClick={onRestart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 bg-[#E9E9EB] dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-full transition-colors text-sm font-medium shadow-sm border border-gray-200 dark:border-gray-700"
      >
        <RefreshCw className="w-4 h-4" />
        Restart Simulation
      </motion.button>
    </motion.div>
  );
}
