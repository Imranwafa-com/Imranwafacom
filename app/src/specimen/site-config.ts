// Site configuration for the Specimen Sheet portfolio.
// Ported verbatim from the Claude Design handoff (site-config.js).

export interface SiteConfig {
  personal: {
    name: string;
    firstName: string;
    logo: string;
    tagline: string;
    email: string;
    github: string;
    githubHandle: string;
  };
  socialLinks: { platform: string; url: string }[];
  idleMessages: string[];
  scrollQuirks: {
    speedWarnings: string[];
    bottomMessages: string[];
  };
  tldr: {
    title: string;
    unlockMessage: string;
    summaryText: string;
    items: { label: string; value: string }[];
    backText: string;
    footerHint: string;
  };
  commandPalette: {
    placeholder: string;
    hintTyping: string;
    hintKeys: string;
    phone: string;
    statsHeading: string;
    secretHeading: string;
    secretFoundText: string;
    txtHeading: string;
    txtChatLink: string;
    backText: string;
    commandDescriptions: Record<string, string>;
    secretSections: {
      commands: string;
      shortcuts: string;
      hidden: string;
      shortcutItems: { key: string; desc: string }[];
      hiddenItems: { key: string; desc: string }[];
    };
  };
  easterEgg: {
    consoleGreeting: string;
    consoleMessage: string;
    consoleTech: string;
    consoleRecruiter: string;
    overlayTitle: string;
    overlayMessage: string;
    overlayButtonText: string;
  };
}

export const SITE: SiteConfig = {
  personal: {
    name: "Imran Wafa",
    firstName: "Imran",
    logo: "IW",
    tagline: "i keep systems running. and turn data into dashboards.",
    email: "contact@imranwafa.com",
    github: "https://github.com/imranhwafa",
    githubHandle: "imranhwafa",
  },
  socialLinks: [
    { platform: "GitHub", url: "https://github.com/imranhwafa" },
    { platform: "LinkedIn", url: "https://www.linkedin.com/in/imran-w-9741082a3" },
    { platform: "Email", url: "mailto:contact@imranwafa.com" },
  ],
  idleMessages: [
    "connection holds.",
    "fun fact: you've now spent more time here than i spent on some of these features.",
    "if you're waiting for something to happen… this is it.",
    "at this point we're basically friends.",
    "the longer you stay, the more easter eggs you might find…",
    "still here. the page will wait.",
  ],
  scrollQuirks: {
    speedWarnings: [
      "high scroll velocity logged.",
      "skim mode. noted.",
      "the short version lives at /tldr.",
    ],
    bottomMessages: [
      "you made it to the bottom. thorough.",
      "that's everything. or is it?",
      "100% scroll completion unlocked.",
    ],
  },
  tldr: {
    title: "/tldr",
    unlockMessage: "you unlocked this by skipping everything. impressive.",
    summaryText: "here's the whole site in 30 seconds.",
    items: [
      { label: "what", value: "runs network & database ops, automates things, analyzes data." },
      { label: "stack", value: "linux, sql, python, power bi, aws, react when i'm building." },
      { label: "vibe", value: "uptime-focused, readable runbooks, chronic automator." },
      { label: "status", value: "data analytics student. keeping systems up. always shipping." },
    ],
    backText: "back to the full site",
    footerHint: "the long version is still up there.",
  },
  commandPalette: {
    placeholder: "type a command...",
    hintTyping: "just start typing anywhere",
    hintKeys: "enter to run · esc to close",
    phone: "+1 (703) 364-9357",
    statsHeading: "your stats",
    secretHeading: "all secrets",
    secretFoundText: "you found the master list. nice.",
    txtHeading: "get in touch",
    txtChatLink: "or jump to the contact section →",
    backText: "← back",
    commandDescriptions: {
      stats: "your browsing stats for this site",
      tldr: "the whole site in 30 seconds",
      txt: "send me a message + phone number",
      email: "open email directly",
      secret: "all hidden commands & shortcuts",
      home: "go back to home",
      about: "learn about me",
      projects: "see what i've built",
      github: "view my github",
      linkedin: "connect on linkedin",
      clear: "close this prompt",
    },
    secretSections: {
      commands: "type commands",
      shortcuts: "keyboard shortcuts",
      hidden: "hidden behaviors",
      shortcutItems: [
        { key: "ctrl/cmd + u", desc: "view source easter egg" },
        { key: "ctrl/cmd + i", desc: "view source easter egg" },
      ],
      hiddenItems: [
        { key: "skip 3 sections", desc: "unlocks /tldr page" },
        { key: "scroll too fast", desc: "speed reader warning" },
        { key: "idle 2 minutes", desc: "idle messages appear" },
        { key: "reach bottom", desc: "completionist message" },
        { key: "click name 3x+", desc: "click counter easter egg" },
        { key: "↑↑↓↓←→←→BA", desc: "overdrive mode" },
        { key: "toggle theme 2x+", desc: "lightswitch counter" },
        { key: "filter 5x+", desc: "filter roulette" },
        { key: "leave the tab", desc: "the tab title reacts" },
      ],
    },
  },
  easterEgg: {
    consoleGreeting: "Hey there, curious dev!",
    consoleMessage: "It's all open source — repo link below.",
    consoleTech: "Built with React + Vite.",
    consoleRecruiter: "Hiring? The paper version lives at /resume.",
    overlayTitle: "source code.",
    overlayMessage: "The repo for this site is public — link below.",
    overlayButtonText: "View on GitHub",
  },
};
