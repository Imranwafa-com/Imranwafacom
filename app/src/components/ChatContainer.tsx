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
import { trackContactMessage, trackContactEmail } from '../lib/analytics';
import { playSendSound, playReceiveSound } from '../lib/sounds';
import config from '../lib/config';

const INTRO_MESSAGES = config.chat.introMessages;

const LINKS_MESSAGE = config.chat.linksMessage;

const LINK_PREVIEWS = config.chat.linkPreviews as LinkPreview[];

const EMAIL_ASK_PHRASES = config.chat.emailAskPhrases;

const EMAIL_CONFIRM_PHRASES = config.chat.emailConfirmPhrases;

const GENERIC_RESPONSES = config.chat.genericResponses;


const STORAGE_KEY = 'imran-portfolio-messages';
const SESSION_KEY = 'imran-portfolio-session';
const CTA_KEY = 'imran-portfolio-cta';
const EMAIL_KEY = 'imran-portfolio-sender-email';

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
  const [inputMode, setInputMode] = useState<'message' | 'email'>('message');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [senderEmail, setSenderEmail] = useState<string>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_ctaPhrase, setCtaPhrase] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const storedMessages = localStorage.getItem(STORAGE_KEY);
    const storedCTA = localStorage.getItem(CTA_KEY);
    const storedEmail = localStorage.getItem(EMAIL_KEY);

    // Use sessionStorage for session tracking so navigating between pages
    // doesn't trigger "return visit" messages — only actual page refreshes do.
    const sessionVisited = sessionStorage.getItem(SESSION_KEY);
    const isNewSession = !sessionVisited;

    if (storedEmail) {
      setSenderEmail(storedEmail);
    }

    const loadMessages = () => {
      if (storedMessages) {
        try {
          const parsed: StoredMessage[] = JSON.parse(storedMessages);
          const loadedMessages: Message[] = parsed.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          }));

          // Only show return-visit messages on actual new sessions (page refresh),
          // NOT on in-app navigation between routes.
          if (isNewSession) {
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
          } else {
            setMessages(loadedMessages);
          }

          setShowRestart(true);

          // Restore or generate CTA phrase
          if (storedCTA) {
            setCtaPhrase(storedCTA);
          } else {
            const newCTA = getRandomCTAPhrase();
            setCtaPhrase(newCTA);
            localStorage.setItem(CTA_KEY, newCTA);
          }
        } catch {
          startIntroSequence();
        }
      } else {
        // First visit ever
        startIntroSequence();
      }

      // Mark this session as visited (persists across in-app navigation)
      sessionStorage.setItem(SESSION_KEY, 'true');
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
    const newCTA = getRandomCTAPhrase();
    setCtaPhrase(newCTA);
    localStorage.setItem(CTA_KEY, newCTA);

    let messageIndex = 0;

    const showNextMessage = () => {
      if (messageIndex >= INTRO_MESSAGES.length) {
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
                setShowRestart(true);
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

    // Mark session as visited when starting intro too
    sessionStorage.setItem(SESSION_KEY, 'true');
    showNextMessage();
  }, []);

  const addBotMessage = useCallback((text: string, delay = 500, typingDuration = 800) => {
    setTimeout(() => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        playReceiveSound();
        const msg: Message = {
          id: generateId(),
          text,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => {
          const updated = [...prev, msg];
          saveMessages(updated);
          return updated;
        });
      }, typingDuration);
    }, delay);
  }, []);

  const sendToApi = useCallback(async (text: string, email: string) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          senderEmail: email,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.aiResponse?.response || "thanks! i'll get back to you soon";
        addBotMessage(aiResponse, 500, 1200);
      } else {
        throw new Error('Failed');
      }
    } catch {
      const genericResponse = GENERIC_RESPONSES[Math.floor(Math.random() * GENERIC_RESPONSES.length)];
      addBotMessage(genericResponse);
    }
  }, [addBotMessage]);

  const handleSendMessage = async (text: string) => {
    if (isSending) return;

    // Add user message bubble
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

    // Sound + analytics
    playSendSound();
    trackContactMessage(text);

    // Check if we have the sender's email
    if (!senderEmail) {
      // No email yet — save message, ask for email
      setPendingMessage(text);
      setInputMode('email');

      const askPhrase = EMAIL_ASK_PHRASES[Math.floor(Math.random() * EMAIL_ASK_PHRASES.length)];
      addBotMessage(askPhrase, 500, 900);
    } else {
      // Email already saved — send immediately
      setIsSending(true);

      // Mark as delivered
      setTimeout(() => {
        setMessages((prev) => {
          const updated = prev.map((msg) =>
            msg.id === userMessage.id ? { ...msg, status: 'delivered' as const } : msg
          );
          saveMessages(updated);
          return updated;
        });
      }, 300);

      await sendToApi(text, senderEmail);
      setIsSending(false);
    }
  };

  const handleEmailSubmit = async (email: string) => {
    // Show user's email as a message bubble
    const emailMessage: Message = {
      id: generateId(),
      text: email,
      isUser: true,
      timestamp: new Date(),
      status: 'delivered',
    };

    setMessages((prev) => {
      const updated = [...prev, emailMessage];
      saveMessages(updated);
      return updated;
    });

    // Save email
    setSenderEmail(email);
    localStorage.setItem(EMAIL_KEY, email);
    setInputMode('message');

    // Track analytics
    trackContactEmail(email);

    // Bot confirms and sends
    const confirmPhrase = EMAIL_CONFIRM_PHRASES[Math.floor(Math.random() * EMAIL_CONFIRM_PHRASES.length)];
    addBotMessage(confirmPhrase, 500, 800);

    // Send the pending message
    if (pendingMessage) {
      setIsSending(true);
      await sendToApi(pendingMessage, email);
      setPendingMessage(null);
      setIsSending(false);
    }
  };

  const handleRestart = () => {
    // Clear all storage
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CTA_KEY);
    localStorage.removeItem(EMAIL_KEY);
    sessionStorage.removeItem(SESSION_KEY);

    // Reset state
    setMessages([]);
    setShowRestart(false);
    setSenderEmail('');
    setInputMode('message');
    setPendingMessage(null);

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
    <div className="flex flex-col h-full bg-white dark:bg-black overflow-hidden">
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
      <InputBar
        onSendMessage={handleSendMessage}
        onSubmitEmail={handleEmailSubmit}
        mode={inputMode}
        disabled={isSending}
      />
    </div>
  );
}
