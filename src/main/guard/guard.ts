import { Session } from '../types';

class Guard {
    /* Currently hardcoded - upgraded to a store later on*/
    private _popularUnrelatedUrl: string[] = [
        'chrome://',
        'chrome-extension://',
        'edge://',
        'about:blank',
    ];

    // should be on the database but hardcoded
    private _whitelist: string[] = [
        'bbc.com',
        'cnn.com',
        'wikipedia.org',
        'nytimes.com',
        'medium.com',
        'doraemon.fandom.com',
        'inuyasha.fandom.com',
    ];

    // configurable
    private _durationThreshold = 0.1;
    private _depthThreshold = 20;
    private _highlightsThreshold = 3;

    public isWhitelisted(url: string): boolean {
        const domain = new URL(url).hostname;
        return this._whitelist.some(allowed => domain.includes(allowed));
    }

    public isGoodSession(session: Session): boolean {
        // time spent on
        if (session.duration < this._durationThreshold) {
            return false;
        }

        // scrollDepths
        if (session.scrollDepth < this._depthThreshold) {
            return false;
        }

        // highlights
        if (session.highlights.length < this._highlightsThreshold) {
            return false;
        }

        return true;
    }

    public addWhiteList() {}
}

export default Guard;
