'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import ChatContainer to avoid SSR issues with localStorage
const ChatContainer = dynamic(() => import('@/components/ChatContainer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-white dark:bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xl animate-pulse">
          IW
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen bg-white dark:bg-black">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-xl animate-pulse">
                IW
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Loading...</p>
            </div>
          </div>
        }
      >
        <ChatContainer />
      </Suspense>
    </main>
  );
}
