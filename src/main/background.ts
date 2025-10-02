// background.ts working in the background of the extension
import { Session, Sessions } from './types';
import { PLACEHOLDER } from './constants';
import Guard from './guard/guard';
import { uploadSession } from '../api/api';

const sessions: Sessions = {};
const trackedTabs = new Set<number>();
const guard = new Guard();

function isTracked(tabId: number) {
    return trackedTabs.has(tabId);
}

// when the tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // will be run for any kind of tab
    // URL changed → flush previous session
    if (!isTracked(tabId)) {
        return;
    }
    if (changeInfo.url && sessions[tabId]) {
        flushSession(tabId);
    }
    // // Page finished loading → start new session
    // if (changeInfo.status === 'complete') {
    //     sessions[tabId] = {
    //         url: tab.url || PLACEHOLDER,
    //         title: tab.title || PLACEHOLDER,
    //         startedAt: Date.now(),
    //         endedAt: Date.now(),
    //         duration: 0,
    //         highlights: [],
    //         clicks: [],
    //         scrollDepth: 0,
    //     };
    // }
});

async function flushSession(tabId: number) {
    // call when a tab is closed
    // or the another page is loaded

    const session = sessions[tabId];
    if (session) {
        session.endedAt = Date.now();
        session.duration = (session.endedAt - session.startedAt) / (1000 * 60);

        // apply guard
        if (guard.isGoodSession(session)) {
            // store into local storage
            chrome.storage.local.get({ interactions: [] }, data => {
                const updated = [...data.interactions, session];
                chrome.storage.local.set({ interactions: updated });
            });

            const response = await uploadSession(session);
            console.log(response.state);
        }

        delete sessions[tabId];
    }
}

// when closing the tab
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    if (isTracked(tabId)) {
        flushSession(tabId);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const tabId = sender.tab?.id;
    if (!tabId || !sessions[tabId]) return;

    if (message.action === 'link_clicked') {
        sessions[tabId].clicks.push({
            url: message.url,
            timestamp: Date.now(),
        });
    } else if (message.action === 'text_selected') {
        sessions[tabId].highlights.push({
            text: message.text,
            timestamp: Date.now(),
        });
    } else if (message.action === 'scroll_depth') {
        sessions[tabId].scrollDepth = Math.max(
            sessions[tabId].scrollDepth,
            message.percent
        );
    }

    sendResponse({ status: 'ok' });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'get_sessions') {
        sendResponse(sessions);
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!sender.tab || !sender.tab.id) return;

    const tab = sender.tab;
    const tabId = sender.tab.id;

    if (message.type === 'CHECK_WHITELIST') {
        // validate using the whitelist
        const allowed = guard.isWhitelisted(message.url);
        if (allowed) {
            // allow the tab to open a new session
            // create a simple store for that session
            trackedTabs.add(tabId);
            const newSession: Session = {
                url: tab.url || PLACEHOLDER,
                title: tab.title || PLACEHOLDER,
                startedAt: Date.now(),
                endedAt: 0,
                duration: 0,
                highlights: [],
                clicks: [],
                scrollDepth: 0,
            };
            sessions[tabId] = newSession;
        }
        sendResponse({ allowed });
    }
    return true;
});
