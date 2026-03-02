import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Plus, Mail } from 'lucide-react';
import { playErrorSound, playSendSound } from '../lib/sounds';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  onSubmitEmail?: (email: string) => void;
  mode?: 'message' | 'email';
  disabled?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InputBar({
  onSendMessage,
  onSubmitEmail,
  mode = 'message',
  disabled = false,
}: InputBarProps) {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [emailError, setEmailError] = useState('');

  const isEmailMode = mode === 'email';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!inputText.trim() || disabled) return;

    if (isEmailMode) {
      // Validate email
      if (!EMAIL_REGEX.test(inputText.trim())) {
        setEmailError('enter a valid email address');
        playErrorSound();
        return;
      }
      setEmailError('');
      playSendSound();
      onSubmitEmail?.(inputText.trim());
    } else {
      onSendMessage(inputText.trim());
    }
    setInputText('');
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-[#F2F2F7] dark:bg-[#1C1C1E] px-4 py-3 pb-safe border-t border-gray-200 dark:border-gray-800"
    >
      {/* Email error message */}
      <AnimatePresence>
        {emailError && (
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="text-xs text-red-500 mb-1.5 ml-12 max-w-4xl mx-auto"
          >
            {emailError}
          </motion.p>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Plus / Email Icon */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          disabled={disabled}
        >
          {isEmailMode ? (
            <Mail className="w-6 h-6 text-[#007AFF]" strokeWidth={2} />
          ) : (
            <Plus className="w-6 h-6" strokeWidth={2.5} />
          )}
        </motion.button>

        {/* Input Field */}
        <div
          className={`flex-1 bg-white dark:bg-[#2C2C2E] rounded-full px-4 py-2.5 flex items-center transition-all duration-200 ${isFocused
            ? isEmailMode
              ? 'ring-2 ring-[#007AFF]/50 shadow-sm'
              : 'ring-2 ring-[#007AFF]/30 shadow-sm'
            : 'shadow-sm'
            }`}
        >
          <input
            type={isEmailMode ? 'email' : 'text'}
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (emailError) setEmailError('');
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isEmailMode ? 'your@email.com' : 'iMessage'}
            disabled={disabled}
            autoComplete={isEmailMode ? 'email' : 'off'}
            className="flex-1 bg-transparent outline-none text-[16px] text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
          />
        </div>

        {/* Send Button */}
        <motion.button
          type="submit"
          disabled={!inputText.trim() || disabled}
          whileHover={inputText.trim() && !disabled ? { scale: 1.1 } : {}}
          whileTap={inputText.trim() && !disabled ? { scale: 0.95 } : {}}
          className={`p-2 rounded-full transition-all flex-shrink-0 ${inputText.trim() && !disabled
            ? 'bg-[#007AFF] text-white shadow-md'
            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}
        >
          <Send className="w-5 h-5" />
        </motion.button>
      </form>
    </motion.div>
  );
}
