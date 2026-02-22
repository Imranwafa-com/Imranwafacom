import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Get relative time string (e.g., "Just now", "1 hour ago", "Yesterday")
export function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return formatDate(date);
  }
}

// Check if two dates are on the same day
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// Random phrase generators
const CTA_PHRASES = [
  'shoot me a message',
  'send me a text',
  'give me a shout',
  'drop me a line',
  'reach out anytime',
  'say what\'s up',
  'let\'s connect',
];

const REFRESH_WELCOME_PHRASES = [
  'you back?',
  'back again?',
  'missed me?',
  'round two?',
  'we meet again.',
  'couldn\'t stay away?',
  'still here?',
  'that was quick.',
  'back so soon?',
  'you weren\'t done, huh?',
];

const FOLLOW_UP_PHRASES = [
  'want to add something else?',
  'anything you forgot to mention?',
  'need to clarify something?',
  'want to expand on that?',
  'have more to say?',
];

export function getRandomCTAPhrase(): string {
  return CTA_PHRASES[Math.floor(Math.random() * CTA_PHRASES.length)];
}

export function getRandomRefreshWelcomePhrase(): string {
  return REFRESH_WELCOME_PHRASES[Math.floor(Math.random() * REFRESH_WELCOME_PHRASES.length)];
}

export function getRandomFollowUpPhrase(): string {
  return FOLLOW_UP_PHRASES[Math.floor(Math.random() * FOLLOW_UP_PHRASES.length)];
}
