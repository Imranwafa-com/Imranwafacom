'use client';

import { useState, FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, Plus } from 'lucide-react';

interface InputBarProps {
  onSendMessage: (message: string) => void;
  onSubmitEmail?: (email: string) => void;
  mode?: 'message' | 'email';
  disabled?: boolean;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InputBar({
  onSendMessage,
  onSubmitEmail,
  mode = 'message',
  disabled = false,
}: InputBarProps) {
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;

    if (mode === 'email') {
      if (!isValidEmail(inputText.trim())) {
        setEmailError(true);
        return;
      }
      setEmailError(false);
      onSubmitEmail?.(inputText.trim());
      setInputText('');
    } else {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="bg-[#F2F2F7] dark:bg-[#1C1C1E] px-4 py-3 pb-safe border-t border-gray-200 dark:border-gray-800"
    >
      <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
        {/* Plus Button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0"
          disabled={disabled}
        >
          <Plus className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>

        {/* Input Field */}
        <div className="flex-1 flex flex-col">
          <div
            className={`bg-white dark:bg-[#2C2C2E] rounded-full px-4 py-2.5 flex items-center transition-all duration-200 ${emailError
                ? 'ring-2 ring-red-400/60 shadow-sm'
                : isFocused
                  ? 'ring-2 ring-[#007AFF]/30 shadow-sm'
                  : 'shadow-sm'
              }`}
          >
            <input
              type={mode === 'email' ? 'email' : 'text'}
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (emailError) setEmailError(false);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={mode === 'email' ? 'your@email.com' : 'iMessage'}
              disabled={disabled}
              className="flex-1 bg-transparent outline-none text-[16px] text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50"
            />
          </div>
          {emailError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-red-500 mt-1 ml-4"
            >
              enter a valid email address
            </motion.p>
          )}
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
