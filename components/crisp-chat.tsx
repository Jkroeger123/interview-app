'use client'

import Script from 'next/script'

const CRISP_WEBSITE_ID = '2b81d99a-8639-4e6b-914d-8905e3dbe37f'

export function CrispChat() {
  return (
    <Script
      id="crisp-widget"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.$crisp = [];
          window.CRISP_WEBSITE_ID = "${CRISP_WEBSITE_ID}";
          (function() {
            var d = document;
            var s = d.createElement("script");
            s.src = "https://client.crisp.chat/l.js";
            s.async = 1;
            d.getElementsByTagName("head")[0].appendChild(s);
          })();
        `,
      }}
    />
  )
}

// Helper functions to interact with Crisp
// Usage: import { crispChat } from '@/components/crisp-chat'

export const crispChat = {
  // Open the chat widget
  open: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:open'])
    }
  },

  // Close the chat widget
  close: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:close'])
    }
  },

  // Show the chat widget
  show: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:show'])
    }
  },

  // Hide the chat widget
  hide: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'chat:hide'])
    }
  },

  // Set user email (useful after login)
  setUserEmail: (email: string) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'user:email', [email]])
    }
  },

  // Set user nickname
  setUserNickname: (nickname: string) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'user:nickname', [nickname]])
    }
  },

  // Set user data (custom attributes)
  setUserData: (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['set', 'session:data', [[key, value]]])
    }
  },

  // Send a message from the user
  sendMessage: (message: string) => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'message:send', ['text', message]])
    }
  },

  // Reset the session (useful on logout)
  reset: () => {
    if (typeof window !== 'undefined' && window.$crisp) {
      window.$crisp.push(['do', 'session:reset'])
    }
  },
}

// TypeScript declarations for Crisp
declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}
