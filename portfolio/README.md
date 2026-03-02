# Imran Wafa - iMessage Portfolio

An interactive, iMessage-style personal portfolio website built with Next.js 14, TypeScript, and Tailwind CSS. Features animated message sequences, link preview cards, a contact form with email collection and AI-powered responses, rate limiting, session persistence, and dark mode support.

![Portfolio Preview](./public/preview.png)

## Features

- **iMessage Interface**: Authentic iOS-style chat interface with realistic message bubbles and animations
- **Animated Message Sequence**: Sequential intro messages with typing indicators and natural timing
- **Link Preview Cards**: Rich link previews for LinkedIn, GitHub, and Email with icons and descriptions
- **Contact Form via Chat**: Users send messages directly through the chat — feels like texting
- **Email Collection**: Prompts users for their email before sending, stores it for future messages
- **AI-Powered Responses**: Intent detection summarizes messages and generates contextual auto-replies
- **Email Delivery**: Backend API with Nodemailer forwards messages to your inbox with HTML formatting
- **Rate Limiting**: In-memory rate limiter (1 message per 30 seconds per IP)
- **Spam Detection**: Pattern-based spam filtering on the server
- **Session Persistence**: Messages persist in localStorage across page loads
- **Refresh Detection**: Shows welcome-back messages with relative timestamps on page refresh
- **Restart Option**: Users can clear the conversation and restart the intro sequence
- **Dark Mode Support**: Automatic dark mode based on system preferences
- **SEO Optimized**: Meta tags, Open Graph, Twitter Cards, and structured data
- **Mobile First**: Fully responsive design optimized for mobile devices
- **Accessibility**: Keyboard navigation, screen reader support, reduced motion preferences

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [tailwind-merge](https://github.com/dcastil/tailwind-merge) / [clsx](https://github.com/lukeed/clsx)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Email**: [Nodemailer](https://nodemailer.com/)
- **Deployment**: [Vercel](https://vercel.com/) (recommended)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- SMTP credentials (for email functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/imranwafa/imessage-portfolio.git
cd imessage-portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your credentials:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
RECIPIENT_EMAIL=your-email@gmail.com
```

> **Note**: For Gmail, you'll need to generate an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── contact/
│   │   │       └── route.ts          # Contact API with rate limiting, spam detection & AI responses
│   │   ├── fonts/                    # Local font files
│   │   ├── globals.css               # Global styles & CSS variables
│   │   ├── layout.tsx                # Root layout with SEO meta tags
│   │   └── page.tsx                  # Main page
│   ├── components/
│   │   ├── ChatContainer.tsx         # Main chat logic, message sequencing & session persistence
│   │   ├── ChatHeader.tsx            # Chat header with name and online status
│   │   ├── InputBar.tsx              # Message/email input bar with mode switching
│   │   ├── LinkPreviewCard.tsx       # Rich link preview cards (LinkedIn, GitHub, Email)
│   │   ├── MessageBubble.tsx         # Styled message bubbles with delivery status
│   │   ├── RestartButton.tsx         # Conversation restart button
│   │   └── TypingIndicator.tsx       # Animated typing dots
│   └── lib/
│       ├── types.ts                  # TypeScript interfaces (Message, LinkPreview, AIResponse, etc.)
│       └── utils.ts                  # Utilities (IDs, dates, random phrase generators)
├── public/
│   └── manifest.json                 # PWA manifest
├── .env.example                      # Example environment variables
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── package.json
└── README.md
```

## Customization

### Update Personal Information

1. **Name and Avatar**: Edit `src/components/ChatHeader.tsx` and `src/components/MessageBubble.tsx`
2. **Intro Messages**: Edit the `INTRO_MESSAGES` array in `src/components/ChatContainer.tsx`
3. **Social Links**: Update the `LINK_PREVIEWS` array in `src/components/ChatContainer.tsx`

### Update Link Previews

In `src/components/ChatContainer.tsx`, update the `LINK_PREVIEWS` array:

```typescript
const LINK_PREVIEWS: LinkPreview[] = [
  {
    url: 'https://linkedin.com/in/YOUR_USERNAME',
    title: 'LinkedIn',
    description: 'Connect with me professionally and view my experience.',
    domain: 'linkedin.com',
    icon: 'linkedin',
  },
  // ... other links
];
```

### Update Colors

The iMessage blue color is defined in `src/app/globals.css`:

```css
:root {
  --imessage-blue: #007AFF;
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com/)
3. Add environment variables in Vercel dashboard
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Other Platforms

Build the project:
```bash
npm run build
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SMTP_HOST` | SMTP server host | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP username/email | Yes |
| `SMTP_PASS` | SMTP password/app password | Yes |
| `RECIPIENT_EMAIL` | Where to receive messages | Yes |
| `GOOGLE_SITE_VERIFICATION` | Google Search Console verification | No |

## API Routes

### POST /api/contact

Sends a message via email with AI-powered summarization and auto-response.

**Request Body:**
```json
{
  "message": "Hello!",
  "senderEmail": "user@example.com",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "aiResponse": {
    "summary": "getting in touch",
    "response": "Got it. I'll follow up on getting in touch soon."
  },
  "rateLimit": {
    "remaining": 0,
    "resetTime": 1704067200000
  }
}
```

**Rate Limiting:**
- Maximum 1 request per 30 seconds per IP
- Returns `429 Too Many Requests` if limit exceeded

**Spam Detection:**
- Filters messages matching common spam patterns
- Returns `400 Bad Request` for flagged content

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - feel free to use this template for your own portfolio!

## Credits

- Design inspired by Apple iMessage
- Built with [Next.js](https://nextjs.org/)
- Icons by [Lucide](https://lucide.dev/)
- Animations by [Framer Motion](https://www.framer.com/motion/)

---

Made with ❤️ by [Imran Wafa](https://github.com/imranwafa)
