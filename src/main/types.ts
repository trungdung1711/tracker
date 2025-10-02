export interface ClickEvent {
  url: string;
  timestamp: number;
}

export interface HighlightEvent {
  text: string;
  timestamp: number;
}

export interface Session {
  url: string;
  title: string;
  startedAt: number;
  endedAt: number;
  duration: number;
  highlights: HighlightEvent[];
  clicks: ClickEvent[];
  scrollDepth: number;
}

export type Sessions = Record<string, Session>;
