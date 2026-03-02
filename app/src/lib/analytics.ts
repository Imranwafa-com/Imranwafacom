/**
 * Lightweight client-side analytics module.
 * Tracks page views, navigation events, time on page, and contact interactions.
 * All data is stored in localStorage for simplicity — no external services required.
 */

const ANALYTICS_KEY = 'imran-portfolio-analytics';

export interface AnalyticsEvent {
    type: 'page_view' | 'navigation' | 'contact_message' | 'contact_email' | 'link_click' | 'project_filter' | 'theme_toggle' | 'session_start' | 'session_end';
    page?: string;
    detail?: string;
    timestamp: string;
    sessionId: string;
    duration?: number; // ms
}

export interface AnalyticsSummary {
    totalSessions: number;
    totalPageViews: number;
    totalMessages: number;
    averageSessionDuration: number; // ms
    pageViews: Record<string, number>;
    topPages: { page: string; views: number }[];
    recentEvents: AnalyticsEvent[];
    firstVisit: string;
    lastVisit: string;
}

interface StoredAnalytics {
    events: AnalyticsEvent[];
    sessions: { id: string; start: string; end?: string }[];
}

let currentSessionId: string = '';
let sessionStartTime: number = 0;
let currentPage: string = '';
let pageEnterTime: number = 0;

function getStored(): StoredAnalytics {
    try {
        const raw = localStorage.getItem(ANALYTICS_KEY);
        if (raw) return JSON.parse(raw);
    } catch {
        // ignore
    }
    return { events: [], sessions: [] };
}

function save(data: StoredAnalytics): void {
    try {
        // Keep last 500 events max to avoid bloating localStorage
        if (data.events.length > 500) {
            data.events = data.events.slice(-500);
        }
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
    } catch {
        // ignore storage full
    }
}

function pushEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId'>): void {
    const stored = getStored();
    stored.events.push({
        ...event,
        timestamp: new Date().toISOString(),
        sessionId: currentSessionId,
    });
    save(stored);
}

// --- Public API ---

export function initSession(): void {
    currentSessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    sessionStartTime = Date.now();

    const stored = getStored();
    stored.sessions.push({ id: currentSessionId, start: new Date().toISOString() });
    save(stored);

    pushEvent({ type: 'session_start' });

    // Track session end on page unload
    window.addEventListener('beforeunload', endSession);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            endSession();
        }
    });
}

function endSession(): void {
    const duration = Date.now() - sessionStartTime;
    pushEvent({ type: 'session_end', duration });

    const stored = getStored();
    const session = stored.sessions.find((s) => s.id === currentSessionId);
    if (session) {
        session.end = new Date().toISOString();
    }
    save(stored);
}

export function trackPageView(page: string): void {
    // Track time on previous page
    if (currentPage && pageEnterTime) {
        const duration = Date.now() - pageEnterTime;
        pushEvent({ type: 'page_view', page: currentPage, duration, detail: `${Math.round(duration / 1000)}s` });
    }

    currentPage = page;
    pageEnterTime = Date.now();

    pushEvent({ type: 'navigation', page });
}

export function trackContactMessage(messagePreview: string): void {
    pushEvent({
        type: 'contact_message',
        detail: messagePreview.substring(0, 50), // First 50 chars only
    });
}

export function trackContactEmail(email: string): void {
    pushEvent({
        type: 'contact_email',
        detail: email,
    });
}

export function trackLinkClick(label: string, url: string): void {
    pushEvent({
        type: 'link_click',
        detail: `${label}: ${url}`,
    });
}

export function trackProjectFilter(category: string): void {
    pushEvent({
        type: 'project_filter',
        detail: category,
    });
}

export function trackThemeToggle(theme: string): void {
    pushEvent({
        type: 'theme_toggle',
        detail: theme,
    });
}

export function getAnalyticsSummary(): AnalyticsSummary {
    const stored = getStored();
    const events = stored.events;
    const sessions = stored.sessions;

    // Page view counts
    const pageViews: Record<string, number> = {};
    let totalMessages = 0;

    events.forEach((e) => {
        if (e.type === 'navigation' && e.page) {
            pageViews[e.page] = (pageViews[e.page] || 0) + 1;
        }
        if (e.type === 'contact_message') totalMessages++;
    });

    const topPages = Object.entries(pageViews)
        .map(([page, views]) => ({ page, views }))
        .sort((a, b) => b.views - a.views);

    // Average session duration
    const sessionDurations = events
        .filter((e) => e.type === 'session_end' && e.duration)
        .map((e) => e.duration!);
    const avgDuration = sessionDurations.length > 0
        ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length
        : 0;

    const timestamps = events.map((e) => e.timestamp);

    return {
        totalSessions: sessions.length,
        totalPageViews: Object.values(pageViews).reduce((a, b) => a + b, 0),
        totalMessages,
        averageSessionDuration: avgDuration,
        pageViews,
        topPages,
        recentEvents: events.slice(-20),
        firstVisit: timestamps[0] || '',
        lastVisit: timestamps[timestamps.length - 1] || '',
    };
}
