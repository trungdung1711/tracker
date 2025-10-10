// content.ts run for each tab

chrome.runtime.sendMessage(
    // contact background.ts for tracking permission
    { type: 'CHECK_WHITELIST', url: window.location.href },
    response => {
        setupTracking();
        if (response.allowed) {
            setupTracking();
        }
    }
);

function setupTracking() {
    // listen for click - only count Ctrl+Click (opens new tab)
    document.addEventListener('click', event => {
        const target = event.target;

        if (!(target instanceof Element)) return;

        const link = target.closest('a');
        if (link && link.href) {
            // Only count clicks that don't navigate away (Ctrl+Click, middle click, etc.)
            if (event.ctrlKey || event.metaKey || event.button === 1) {
                chrome.runtime.sendMessage({
                    action: 'link_clicked',
                    url: link.href,
                });
            }
        }
    });

    // listen for text selection - capture final selected text only
    document.addEventListener('mouseup', () => {
        const selection = window.getSelection();
        if (selection) {
            const text = selection.toString().trim();
            // Only send meaningful highlights (at least 3 characters)
            if (text.length >= 3) {
                chrome.runtime.sendMessage({
                    action: 'text_selected',
                    text: text,
                });
            }
        }
    });

    // listen for scroll
    let maxScroll = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const winHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        const percent = Math.round(((scrollTop + winHeight) / docHeight) * 100);

        if (percent > maxScroll) {
            maxScroll = percent;
            chrome.runtime.sendMessage({
                action: 'scroll_depth',
                percent: maxScroll,
            });
        }
    });
}
