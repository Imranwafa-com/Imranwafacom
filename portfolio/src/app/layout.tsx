import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Imran Wafa | Portfolio',
  description: 'Hi, I\'m Imran. I build things. Connect with me through this interactive iMessage-style portfolio.',
  keywords: ['Imran Wafa', 'portfolio', 'developer', 'software engineer', 'web developer'],
  authors: [{ name: 'Imran Wafa' }],
  creator: 'Imran Wafa',
  publisher: 'Imran Wafa',
  robots: 'index, follow',
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://imranwafa.dev',
    siteName: 'Imran Wafa Portfolio',
    title: 'Imran Wafa | Portfolio',
    description: 'Hi, I\'m Imran. I build things. Connect with me through this interactive iMessage-style portfolio.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Imran Wafa Portfolio',
      },
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Imran Wafa | Portfolio',
    description: 'Hi, I\'m Imran. I build things. Connect with me through this interactive iMessage-style portfolio.',
    images: ['/og-image.png'],
    creator: '@imranwafa',
  },
  
  // Icons
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  
  // Manifest
  manifest: '/manifest.json',
  
  // Verification (add your own)
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Imran Wafa',
              url: 'https://imranwafa.dev',
              jobTitle: 'Software Developer',
              sameAs: [
                'https://linkedin.com/in/imranwafa',
                'https://github.com/imranwafa',
              ],
            }),
          }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
