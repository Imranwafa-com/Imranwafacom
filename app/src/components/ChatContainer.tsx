import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatHeader from './ChatHeader';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import InputBar from './InputBar';
import RestartButton from './RestartButton';
import type { Message, LinkPreview } from '../lib/types';
import { 
  generateId, 
  formatDate, 
  getRelativeTimeString, 
  getRandomCTAPhrase,
  getRandomRefreshWelcomePhrase,
  getRandomFollowUpPhrase,
} from '../lib/utils';

const INTRO_MESSAGES = [
  { text: 'Hi', delay: 800 },
  { text: "I'm Imran", delay: 2500 },
  { text: 'i build things', delay: 4200 },
];

const LINKS_MESSAGE = 'Here are some places you can find me.';

const LINK_PREVIEWS: LinkPreview[] = [
  {
    url: 'https://linkedin.com/in/imranwafa',
    title: 'LinkedIn',
    description: 'Connect with me professionally and view my experience.',
    domain: 'linkedin.com',
    icon: 'linkedin',
  },
  {
    url: 'https://github.com/imranwafa',
    title: 'GitHub',
    description: 'Check out my code, projects, and open source contributions.',
    domain: 'github.com',
    icon: 'github',
  },
  {
    url: 'mailto:imran@example.com',
    title: 'Email',
    description: 'Send me a direct message for inquiries or collaborations.',
    domain: 'email',
    icon: 'mail',
  },
];

const GENERIC_RESPONSES = [
  'Got it, ill be back with you ASAP',
  'received, give me a minute to review',
  'Sent, let me check it rq',
];

const STORAGE_KEY = 'imran-portfolio-messages';
const SESSION_KEY = 'imran-portfolio-session';
const CTA_KEY = 'imran-portfolio-cta';

interface StoredMessage {
  id: string;
  text: string;
  isUser: boolean;
  type?: 'text' | 'link' | 'link-preview';
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  isSeparator?: boolean;
  separatorText?: string;
}

export default function ChatContainer() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [isSending, setIsSending] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_ctaPhrase, setCtaPhrase] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const storedMessages = localStorage.getItem(STORAGE_KEY);
    const sessionId = localStorage.getItem(SESSION_KEY);
    const storedCTA = localStorage.getItem(CTA_KEY);
    const currentSessionId = Date.now().toString();

    const loadMessages = () => {
      if (storedMessages) {
        try {
          const parsed: StoredMessage[] = JSON.parse(storedMessages);
          const loadedMessages: Message[] = parsed.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));

          // Check if this is a new session (refresh)
          if (sessionId !== currentSessionId) {
            // New session - add separator and welcome messages
            const lastMessage = loadedMessages[loadedMessages.length - 1];
            const separatorMessage: Message = {
              id: generateId(),
              text: '',
              isUser: false,
              timestamp: new Date(),
              isSeparator: true,
              separatorText: getRelativeTimeString(lastMessage?.timestamp || new Date()),
            };

            const welcomeMessage: Message = {
              id: generateId(),
              text: getRandomRefreshWelcomePhrase(),
              isUser: false,
              timestamp: new Date(),
            };

            const followUpMessage: Message = {
              id: generateId(),
              text: getRandomFollowUpPhrase(),
              isUser: false,
              timestamp: new Date(),
            };

            const updatedMessages = [
              ...loadedMessages,
              separatorMessage,
              welcomeMessage,
              followUpMessage,
            ];

            setMessages(updatedMessages);
            saveMessages(updatedMessages);
            setShowRestart(true);
          } else {
            setMessages(loadedMessages);
            setShowRestart(true);
          }

          // Restore or generate CTA phrase
          if (storedCTA) {
            setCtaPhrase(storedCTA);
          } else {
            const newCTA = getRandomCTAPhrase();
            setCtaPhrase(newCTA);
            localStorage.setItem(CTA_KEY, newCTA);
          }
        } catch {
          // If parsing fails, start fresh
          startIntroSequence();
        }
      } else {
        // First visit ever
        startIntroSequence();
      }

      // Set session ID
      localStorage.setItem(SESSION_KEY, currentSessionId);
    };

    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const saveMessages = (msgs: Message[]) => {
    const toStore: StoredMessage[] = msgs.map((m) => ({
      ...m,
      timestamp: m.timestamp.toISOString(),
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
  };

  const startIntroSequence = useCallback(() => {
    // Generate and save CTA phrase
    const newCTA = getRandomCTAPhrase();
    setCtaPhrase(newCTA);
    localStorage.setItem(CTA_KEY, newCTA);

    let messageIndex = 0;

    const showNextMessage = () => {
      if (messageIndex >= INTRO_MESSAGES.length) {
        // Show links message after intro
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            const linksMsg: Message = {
              id: generateId(),
              text: LINKS_MESSAGE,
              isUser: false,
              timestamp: new Date(),
            };
            setMessages((prev) => {
              const updated = [...prev, linksMsg];
              saveMessages(updated);
              return updated;
            });

            // Show CTA message after links
            setTimeout(() => {
              setIsTyping(true);
              setTimeout(() => {
                setIsTyping(false);
                const ctaMsg: Message = {
                  id: generateId(),
                  text: newCTA,
                  isUser: false,
                  timestamp: new Date(),
                };
                setMessages((prev) => {
                  const updated = [...prev, ctaMsg];
                  saveMessages(updated);
                  return updated;
                });
              }, 900);
            }, 1500);
          }, 800);
        }, 500);
        return;
      }

      const message = INTRO_MESSAGES[messageIndex];

      setTimeout(() => {
        setIsTyping(true);

        setTimeout(() => {
          setIsTyping(false);
          const newMessage: Message = {
            id: generateId(),
            text: message.text,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => {
            const updated = [...prev, newMessage];
            saveMessages(updated);
            return updated;
          });
          messageIndex++;
          showNextMessage();
        }, 900);
      }, message.delay - (messageIndex > 0 ? INTRO_MESSAGES[messageIndex - 1].delay : 0));
    };

    showNextMessage();
  }, []);

  const handleSendMessage = async (text: string) => {
    if (isSending) return;

    // Add user message
    const userMessage: Message = {
      id: generateId(),
      text,
      isUser: true,
      timestamp: new Date(),
      status: 'sent',
    };

    setMessages((prev) => {
      const updated = [...prev, userMessage];
      saveMessages(updated);
      return updated;
    });
    setIsSending(true);

    try {
      // Send to backend
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update message status to delivered
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'delivered' as const } : msg
          );
          saveMessages(updated);
          return updated;
        });

        // Show AI response after a delay
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setIsTyping(false);
            const aiResponse = data.aiResponse?.response || "thanks! i'll get back to you soon";
            const replyMessage: Message = {
              id: generateId(),
              text: aiResponse,
              isUser: false,
              timestamp: new Date(),
            };
            setMessages((prev) => {
              const updated = [...prev, replyMessage];
              saveMessages(updated);
              return updated;
            });
          }, 1200);
        }, 500);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Show generic response instead of error
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const genericResponse = GENERIC_RESPONSES[Math.floor(Math.random() * GENERIC_RESPONSES.length)];
          const responseMessage: Message = {
            id: generateId(),
            text: genericResponse,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => {
            const updated = [...prev, responseMessage];
            saveMessages(updated);
            return updated;
          });
        }, 800);
      }, 500);
    } finally {
      setIsSending(false);
    }
  };

  const handleRestart = () => {
    // Clear all storage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CTA_KEY);
    localStorage.removeItem(SESSION_KEY);

    // Reset state
    setMessages([]);
    setShowRestart(false);

    // Restart intro sequence
    startIntroSequence();
  };

  // Group messages by sender for avatar display
  const groupedMessages = messages.reduce((acc, message, idx) => {
    const prevMessage = messages[idx - 1];
    const showAvatar = !prevMessage || prevMessage.isUser !== message.isUser;
    const isLastInGroup =
      idx === messages.length - 1 || messages[idx + 1]?.isUser !== message.isUser;

    acc.push({
      message,
      showAvatar,
      isLastInGroup,
    });

    return acc;
  }, [] as { message: Message; showAvatar: boolean; isLastInGroup: boolean }[]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-black overflow-hidden">
      <ChatHeader name="Imran Wafa" isOnline={true} />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-black">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Date separator for first message */}
          {messages.length > 0 && !messages[0].isSeparator && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mb-6"
            >
              <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full font-medium">
                {formatDate(messages[0].timestamp)}
              </span>
            </motion.div>
          )}

          {/* Messages */}
          <div className="space-y-1">
            {groupedMessages.map(({ message, showAvatar, isLastInGroup }) => (
              <div key={message.id} className="py-0.5">
                {message.isSeparator ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-center my-4"
                  >
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-4 py-1.5 rounded-full font-medium">
                      {message.separatorText}
                    </span>
                  </motion.div>
                ) : (
                  <MessageBubble
                    message={message}
                    showAvatar={showAvatar}
                    isLastInGroup={isLastInGroup}
                    linkPreviews={message.text === LINKS_MESSAGE ? LINK_PREVIEWS : []}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <div className="py-0.5">
                <TypingIndicator showAvatar={true} />
              </div>
            )}
          </AnimatePresence>

          {/* Restart button */}
          <AnimatePresence>
            {showRestart && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-6"
              >
                <RestartButton onRestart={handleRestart} />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <InputBar onSendMessage={handleSendMessage} disabled={isSending} />
    </div>
  );
}
