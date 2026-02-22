export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  type?: 'text' | 'link' | 'link-preview';
  linkData?: {
    url: string;
    icon: 'linkedin' | 'github' | 'mail';
    label: string;
    title: string;
    description: string;
    domain: string;
  };
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  isSeparator?: boolean;
  separatorText?: string;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  domain: string;
  icon: 'linkedin' | 'github' | 'mail';
}

export interface ChatState {
  messages: Message[];
  isTyping: boolean;
  hasVisited: boolean;
  ctaPhrase: string;
}

export interface ContactFormData {
  message: string;
  timestamp: string;
  userAgent: string;
}

export interface AIResponse {
  summary: string;
  response: string;
}
